const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /webhook
 * Handles all Stripe webhook events
 *
 * IMPORTANT: This route must use raw body parser, not JSON
 * Configure in index.js with: app.use('/webhook', express.raw({type: 'application/json'}), webhookRoutes);
 */
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`Received webhook: ${event.type}`);

  try {
    switch (event.type) {
      // ============================================
      // ACCOUNT EVENTS - Connect
      // ============================================
      case 'account.updated': {
        const account = event.data.object;
        await handleAccountUpdated(account);
        break;
      }

      case 'account.application.authorized': {
        const account = event.data.object;
        logger.info('Account application authorized:', account.id);
        break;
      }

      case 'account.application.deauthorized': {
        const account = event.data.object;
        await handleAccountDeauthorized(account);
        break;
      }

      // ============================================
      // PAYMENT EVENTS
      // ============================================
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        await handlePaymentIntentCanceled(paymentIntent);
        break;
      }

      // ============================================
      // PAYMENT METHOD EVENTS
      // ============================================
      case 'payment_method.attached': {
        const paymentMethod = event.data.object;
        await handlePaymentMethodAttached(paymentMethod);
        break;
      }

      case 'payment_method.detached': {
        const paymentMethod = event.data.object;
        await handlePaymentMethodDetached(paymentMethod);
        break;
      }

      // ============================================
      // TREASURY EVENTS
      // ============================================
      case 'treasury.financial_account.features_status_updated': {
        const financialAccount = event.data.object;
        logger.info('Financial account features updated:', financialAccount.id);
        break;
      }

      case 'treasury.received_credit.created': {
        const receivedCredit = event.data.object;
        await handleReceivedCredit(receivedCredit);
        break;
      }

      case 'treasury.received_debit.created': {
        const receivedDebit = event.data.object;
        await handleReceivedDebit(receivedDebit);
        break;
      }

      case 'treasury.outbound_transfer.created': {
        const outboundTransfer = event.data.object;
        logger.info('Outbound transfer created:', outboundTransfer.id);
        break;
      }

      case 'treasury.outbound_transfer.posted': {
        const outboundTransfer = event.data.object;
        await handleOutboundTransferPosted(outboundTransfer);
        break;
      }

      case 'treasury.outbound_transfer.failed': {
        const outboundTransfer = event.data.object;
        await handleOutboundTransferFailed(outboundTransfer);
        break;
      }

      case 'treasury.outbound_transfer.returned': {
        const outboundTransfer = event.data.object;
        await handleOutboundTransferReturned(outboundTransfer);
        break;
      }

      // ============================================
      // PAYOUT EVENTS
      // ============================================
      case 'payout.created': {
        const payout = event.data.object;
        logger.info('Payout created:', payout.id);
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object;
        logger.info('Payout paid:', payout.id);
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object;
        logger.info('Payout failed:', payout.id, payout.failure_message);
        break;
      }

      // ============================================
      // CAPABILITY EVENTS
      // ============================================
      case 'capability.updated': {
        const capability = event.data.object;
        logger.info('Capability updated:', capability.id, capability.status);
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// ============================================
// HANDLER FUNCTIONS
// ============================================

async function handleAccountUpdated(account) {
  try {
    const user = await User.findOne({ stripeAccountId: account.id });
    if (!user) {
      logger.info('No user found for account:', account.id);
      return;
    }

    // Update account status
    if (account.details_submitted) {
      user.stripeAccountStatus = 'enabled';
      user.onboardingStatus = 'completed';
      user.onboardingCompletedAt = new Date();
    } else {
      user.stripeAccountStatus = 'pending';
    }

    // Update KYC status based on requirements
    if (account.requirements) {
      user.kycRequirements = {
        currentlyDue: account.requirements.currently_due || [],
        eventuallyDue: account.requirements.eventually_due || [],
        pastDue: account.requirements.past_due || [],
        pendingVerification: account.requirements.pending_verification || []
      };

      // Determine KYC verification status
      if (account.requirements.currently_due?.length === 0 &&
          account.requirements.past_due?.length === 0) {
        if (account.requirements.pending_verification?.length > 0) {
          user.kycVerificationStatus = 'pending';
        } else {
          user.kycVerificationStatus = 'verified';
        }
      } else {
        user.kycVerificationStatus = 'unverified';
      }
    }

    // Check if account is restricted or disabled
    if (account.requirements?.disabled_reason) {
      user.stripeAccountStatus = 'disabled';
      user.kycVerificationStatus = 'failed';
    }

    await user.save();
    logger.info('Updated user account status:', user._id.toString());

  } catch (error) {
    logger.error('Error handling account.updated:', error);
  }
}

async function handleAccountDeauthorized(account) {
  try {
    const user = await User.findOne({ stripeAccountId: account.id });
    if (user) {
      user.stripeAccountStatus = 'disabled';
      user.onboardingStatus = 'failed';
      await user.save();
      logger.info('Account deauthorized for user:', user._id.toString());
    }
  } catch (error) {
    logger.error('Error handling account.application.deauthorized:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // Check if this is a deposit
    if (paymentIntent.metadata?.type === 'deposit') {
      const userId = paymentIntent.metadata?.venturecast_user_id;

      // Update transaction status
      await Transaction.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        {
          status: 'completed',
          completedAt: new Date()
        }
      );

      // Update user's cached balance
      if (userId) {
        const user = await User.findById(userId);
        if (user && user.financialAccountId) {
          try {
            const fa = await stripe.treasury.financialAccounts.retrieve(
              user.financialAccountId,
              { stripeAccount: user.stripeAccountId }
            );
            user.treasuryBalance.available = fa.balance.cash.usd;
            user.treasuryBalance.pending = fa.balance.inbound_pending.usd;
            await user.save();
          } catch (e) {
            logger.error('Error updating user balance:', e);
          }
        }
      }

      logger.info('Deposit completed:', paymentIntent.id);
    }
  } catch (error) {
    logger.error('Error handling payment_intent.succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      {
        status: 'failed',
        failureCode: paymentIntent.last_payment_error?.code,
        failureMessage: paymentIntent.last_payment_error?.message
      }
    );
    logger.info('Payment intent failed:', paymentIntent.id);
  } catch (error) {
    logger.error('Error handling payment_intent.payment_failed:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { status: 'cancelled' }
    );
    logger.info('Payment intent canceled:', paymentIntent.id);
  } catch (error) {
    logger.error('Error handling payment_intent.canceled:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod) {
  try {
    const customerId = paymentMethod.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });

    if (user) {
      // Add to user's payment methods if not already there
      const exists = user.paymentMethods.some(pm => pm.paymentMethodId === paymentMethod.id);
      if (!exists) {
        user.paymentMethods.push({
          paymentMethodId: paymentMethod.id,
          type: paymentMethod.type,
          last4: paymentMethod.card?.last4,
          brand: paymentMethod.card?.brand,
          expMonth: paymentMethod.card?.exp_month,
          expYear: paymentMethod.card?.exp_year,
          isDefault: user.paymentMethods.length === 0
        });
        await user.save();
        logger.info('Payment method added for user:', user._id.toString());
      }
    }
  } catch (error) {
    logger.error('Error handling payment_method.attached:', error);
  }
}

async function handlePaymentMethodDetached(paymentMethod) {
  try {
    // Remove from all users (should only be one)
    await User.updateMany(
      { 'paymentMethods.paymentMethodId': paymentMethod.id },
      { $pull: { paymentMethods: { paymentMethodId: paymentMethod.id } } }
    );
    logger.info('Payment method detached:', paymentMethod.id);
  } catch (error) {
    logger.error('Error handling payment_method.detached:', error);
  }
}

async function handleReceivedCredit(receivedCredit) {
  try {
    // This fires when money is received in a Treasury financial account
    const userId = receivedCredit.metadata?.venturecast_user_id;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        // Update cached balance
        user.treasuryBalance.available += receivedCredit.amount;
        await user.save();
        logger.info('Received credit for user:', userId, 'Amount:', receivedCredit.amount);
      }
    }
  } catch (error) {
    logger.error('Error handling treasury.received_credit.created:', error);
  }
}

async function handleReceivedDebit(receivedDebit) {
  try {
    const userId = receivedDebit.metadata?.venturecast_user_id;
    if (userId) {
      logger.info('Received debit for user:', userId, 'Amount:', receivedDebit.amount);
    }
  } catch (error) {
    logger.error('Error handling treasury.received_debit.created:', error);
  }
}

async function handleOutboundTransferPosted(outboundTransfer) {
  try {
    // Update transaction status to completed
    await Transaction.findOneAndUpdate(
      { stripeOutboundTransferId: outboundTransfer.id },
      {
        status: 'completed',
        completedAt: new Date()
      }
    );

    // Update user's cached balance
    const userId = outboundTransfer.metadata?.venturecast_user_id;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.treasuryBalance.available -= outboundTransfer.amount;
        await user.save();
      }
    }

    logger.info('Outbound transfer posted:', outboundTransfer.id);
  } catch (error) {
    logger.error('Error handling treasury.outbound_transfer.posted:', error);
  }
}

async function handleOutboundTransferFailed(outboundTransfer) {
  try {
    await Transaction.findOneAndUpdate(
      { stripeOutboundTransferId: outboundTransfer.id },
      {
        status: 'failed',
        failureCode: outboundTransfer.returned_details?.code,
        failureMessage: outboundTransfer.returned_details?.message
      }
    );
    logger.info('Outbound transfer failed:', outboundTransfer.id);
  } catch (error) {
    logger.error('Error handling treasury.outbound_transfer.failed:', error);
  }
}

async function handleOutboundTransferReturned(outboundTransfer) {
  try {
    await Transaction.findOneAndUpdate(
      { stripeOutboundTransferId: outboundTransfer.id },
      {
        status: 'reversed',
        failureCode: outboundTransfer.returned_details?.code,
        failureMessage: outboundTransfer.returned_details?.message
      }
    );

    // Refund the amount back to user's balance
    const userId = outboundTransfer.metadata?.venturecast_user_id;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.treasuryBalance.available += outboundTransfer.amount;
        await user.save();
      }
    }

    logger.info('Outbound transfer returned:', outboundTransfer.id);
  } catch (error) {
    logger.error('Error handling treasury.outbound_transfer.returned:', error);
  }
}

module.exports = router;
