const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Initialize Stripe with API version that supports Treasury
const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// ============================================
// MIDDLEWARE - Verify user authentication
// ============================================
const authenticateUser = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || req.body.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// ============================================
// STRIPE CONNECT - Account Management
// ============================================

/**
 * POST /stripe/create-account
 * Creates a Stripe Connect Custom account for the user
 */
router.post('/create-account', authenticateUser, async (req, res) => {
  try {
    const { user } = req;

    // Check if user already has a Stripe account
    if (user.stripeAccountId) {
      return res.status(400).json({
        error: 'User already has a Stripe account',
        stripeAccountId: user.stripeAccountId
      });
    }

    // Create Stripe Connect Custom Account
    const account = await stripe.accounts.create({
      type: 'custom',
      country: 'US',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        treasury: { requested: true }
      },
      business_type: 'individual',
      business_profile: {
        mcc: '6211', // Securities brokers
        url: 'https://venturecast.app'
      },
      tos_acceptance: {
        service_agreement: 'full'
      },
      metadata: {
        venturecast_user_id: user._id.toString()
      }
    });

    // Update user with Stripe account ID
    user.stripeAccountId = account.id;
    user.stripeAccountStatus = 'pending';
    user.onboardingStatus = 'not_started';
    await user.save();

    res.status(201).json({
      success: true,
      stripeAccountId: account.id,
      message: 'Stripe Connect account created successfully'
    });

  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /stripe/create-financial-account
 * Creates a Stripe Treasury Financial Account for the user
 */
router.post('/create-financial-account', authenticateUser, async (req, res) => {
  try {
    const { user } = req;

    if (!user.stripeAccountId) {
      return res.status(400).json({
        error: 'User must have a Stripe Connect account first'
      });
    }

    if (user.financialAccountId) {
      return res.status(400).json({
        error: 'User already has a financial account',
        financialAccountId: user.financialAccountId
      });
    }

    // Create Treasury Financial Account
    const financialAccount = await stripe.treasury.financialAccounts.create({
      supported_currencies: ['usd'],
      features: {
        card_issuing: { requested: true },
        deposit_insurance: { requested: true },
        financial_addresses: { aba: { requested: true } },
        inbound_transfers: { ach: { requested: true } },
        intra_stripe_flows: { requested: true },
        outbound_payments: {
          ach: { requested: true },
          us_domestic_wire: { requested: true }
        },
        outbound_transfers: {
          ach: { requested: true },
          us_domestic_wire: { requested: true }
        }
      },
      metadata: {
        venturecast_user_id: user._id.toString()
      }
    }, {
      stripeAccount: user.stripeAccountId
    });

    // Update user with financial account info
    user.financialAccountId = financialAccount.id;
    user.financialAccountStatus = financialAccount.status;
    user.treasuryStatus = 'active';
    await user.save();

    res.status(201).json({
      success: true,
      financialAccountId: financialAccount.id,
      status: financialAccount.status,
      message: 'Treasury Financial Account created successfully'
    });

  } catch (error) {
    console.error('Create financial account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /stripe/onboarding-link
 * Generates a hosted onboarding link for KYC verification
 */
router.post('/onboarding-link', authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { returnUrl, refreshUrl } = req.body;

    if (!user.stripeAccountId) {
      return res.status(400).json({
        error: 'User must have a Stripe Connect account first'
      });
    }

    // Create Account Link for hosted onboarding
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: refreshUrl || 'venturecast://stripe/refresh',
      return_url: returnUrl || 'venturecast://stripe/return',
      type: 'account_onboarding',
      collect: 'eventually_due'
    });

    // Update onboarding status
    user.onboardingStatus = 'in_progress';
    await user.save();

    res.json({
      success: true,
      url: accountLink.url,
      expiresAt: accountLink.expires_at
    });

  } catch (error) {
    console.error('Onboarding link error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /stripe/account-status
 * Returns the current Stripe account and verification status
 */
router.get('/account-status', authenticateUser, async (req, res) => {
  try {
    const { user } = req;

    if (!user.stripeAccountId) {
      return res.json({
        hasStripeAccount: false,
        onboardingStatus: 'not_started'
      });
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    // Get financial account balance if exists
    let balance = null;
    if (user.financialAccountId) {
      try {
        const financialAccount = await stripe.treasury.financialAccounts.retrieve(
          user.financialAccountId,
          { stripeAccount: user.stripeAccountId }
        );
        balance = financialAccount.balance;
      } catch (e) {
        console.error('Error fetching financial account:', e);
      }
    }

    res.json({
      hasStripeAccount: true,
      stripeAccountId: user.stripeAccountId,
      accountStatus: account.details_submitted ? 'enabled' : 'pending',
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements,
      onboardingStatus: user.onboardingStatus,
      kycVerificationStatus: user.kycVerificationStatus,
      hasFinancialAccount: !!user.financialAccountId,
      financialAccountId: user.financialAccountId,
      treasuryBalance: balance,
      canTrade: account.charges_enabled && account.payouts_enabled && !!user.financialAccountId
    });

  } catch (error) {
    console.error('Account status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STRIPE CUSTOMER - For Payment Methods
// ============================================

/**
 * POST /stripe/create-customer
 * Creates a Stripe Customer for the user (for payment methods)
 */
router.post('/create-customer', authenticateUser, async (req, res) => {
  try {
    const { user } = req;

    if (user.stripeCustomerId) {
      return res.json({
        success: true,
        customerId: user.stripeCustomerId,
        message: 'Customer already exists'
      });
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        venturecast_user_id: user._id.toString()
      }
    });

    user.stripeCustomerId = customer.id;
    await user.save();

    res.status(201).json({
      success: true,
      customerId: customer.id,
      message: 'Customer created successfully'
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /stripe/setup-intent
 * Creates a SetupIntent for adding a new payment method
 */
router.post('/setup-intent', authenticateUser, async (req, res) => {
  try {
    const { user } = req;

    if (!user.stripeCustomerId) {
      // Create customer first
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { venturecast_user_id: user._id.toString() }
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      metadata: {
        venturecast_user_id: user._id.toString()
      }
    });

    res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    });

  } catch (error) {
    console.error('Setup intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /stripe/payment-methods
 * Lists all payment methods for the user
 */
router.get('/payment-methods', authenticateUser, async (req, res) => {
  try {
    const { user } = req;

    if (!user.stripeCustomerId) {
      return res.json({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card'
    });

    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === user.defaultPaymentMethodId
    }));

    res.json({ paymentMethods: formattedMethods });

  } catch (error) {
    console.error('List payment methods error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /stripe/set-default-payment-method
 * Sets a payment method as the default
 */
router.post('/set-default-payment-method', authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { paymentMethodId } = req.body;

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'No customer account found' });
    }

    // Update customer's default payment method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    user.defaultPaymentMethodId = paymentMethodId;
    await user.save();

    res.json({
      success: true,
      defaultPaymentMethodId: paymentMethodId
    });

  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /stripe/payment-method/:id
 * Removes a payment method
 */
router.delete('/payment-method/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    await stripe.paymentMethods.detach(id);

    // If this was the default, clear it
    if (req.user.defaultPaymentMethodId === id) {
      req.user.defaultPaymentMethodId = null;
      await req.user.save();
    }

    res.json({ success: true, message: 'Payment method removed' });

  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DEPOSITS - PaymentIntent → Treasury
// ============================================

/**
 * POST /stripe/deposit
 * Creates a PaymentIntent for depositing funds into user's financial account
 */
router.post('/deposit', authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { amount, paymentMethodId } = req.body;

    // Validation
    if (!amount || amount < 100) { // Minimum $1.00
      return res.status(400).json({ error: 'Minimum deposit is $1.00' });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'No customer account. Please add a payment method first.' });
    }

    if (!user.financialAccountId) {
      return res.status(400).json({ error: 'No financial account. Please complete onboarding first.' });
    }

    // Create PaymentIntent that transfers to the user's financial account
    const paymentIntentParams = {
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      description: `VentureCast deposit for ${user.email}`,
      metadata: {
        venturecast_user_id: user._id.toString(),
        type: 'deposit',
        financial_account_id: user.financialAccountId
      },
      // Transfer to the connected account
      transfer_data: {
        destination: user.stripeAccountId
      }
    };

    // If a specific payment method is provided
    if (paymentMethodId) {
      paymentIntentParams.payment_method = paymentMethodId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Create pending transaction record
    await Transaction.createDeposit(user._id, amount, paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount
    });

  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /stripe/confirm-deposit
 * Confirms a deposit after PaymentIntent succeeds (called by client)
 */
router.post('/confirm-deposit', authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { paymentIntentId } = req.body;

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }

    // Update transaction status
    const transaction = await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntentId },
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );

    // Update user's local balance cache
    if (user.financialAccountId) {
      try {
        const fa = await stripe.treasury.financialAccounts.retrieve(
          user.financialAccountId,
          { stripeAccount: user.stripeAccountId }
        );
        user.treasuryBalance.available = fa.balance.cash.usd;
        user.treasuryBalance.pending = fa.balance.inbound_pending.usd;
        await user.save();
      } catch (e) {
        console.error('Error updating balance:', e);
      }
    }

    res.json({
      success: true,
      transaction: transaction,
      message: 'Deposit confirmed'
    });

  } catch (error) {
    console.error('Confirm deposit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// WITHDRAWALS - Treasury Outbound Transfer
// ============================================

/**
 * POST /stripe/add-bank-account
 * Adds an external bank account for withdrawals
 */
router.post('/add-bank-account', authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { routingNumber, accountNumber, accountHolderName, accountHolderType } = req.body;

    if (!user.stripeAccountId) {
      return res.status(400).json({ error: 'No Stripe account. Please complete onboarding.' });
    }

    // Create external account on the connected account
    const bankAccount = await stripe.accounts.createExternalAccount(
      user.stripeAccountId,
      {
        external_account: {
          object: 'bank_account',
          country: 'US',
          currency: 'usd',
          routing_number: routingNumber,
          account_number: accountNumber,
          account_holder_name: accountHolderName || user.name,
          account_holder_type: accountHolderType || 'individual'
        }
      }
    );

    // Save to user's external accounts
    user.externalAccounts.push({
      externalAccountId: bankAccount.id,
      type: 'bank_account',
      last4: bankAccount.last4,
      bankName: bankAccount.bank_name,
      routingNumber: bankAccount.routing_number?.slice(-4),
      isDefault: user.externalAccounts.length === 0,
      status: bankAccount.status
    });
    await user.save();

    res.status(201).json({
      success: true,
      bankAccount: {
        id: bankAccount.id,
        last4: bankAccount.last4,
        bankName: bankAccount.bank_name,
        status: bankAccount.status
      }
    });

  } catch (error) {
    console.error('Add bank account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /stripe/bank-accounts
 * Lists user's external bank accounts
 */
router.get('/bank-accounts', authenticateUser, async (req, res) => {
  try {
    const { user } = req;

    if (!user.stripeAccountId) {
      return res.json({ bankAccounts: [] });
    }

    const externalAccounts = await stripe.accounts.listExternalAccounts(
      user.stripeAccountId,
      { object: 'bank_account', limit: 10 }
    );

    const formatted = externalAccounts.data.map(ba => ({
      id: ba.id,
      last4: ba.last4,
      bankName: ba.bank_name,
      status: ba.status,
      isDefault: ba.default_for_currency
    }));

    res.json({ bankAccounts: formatted });

  } catch (error) {
    console.error('List bank accounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /stripe/withdraw
 * Creates a Treasury Outbound Transfer to user's bank account
 */
router.post('/withdraw', authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { amount, destinationAccountId } = req.body;

    // Validation
    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Minimum withdrawal is $1.00' });
    }

    if (!user.financialAccountId) {
      return res.status(400).json({ error: 'No financial account. Please complete onboarding.' });
    }

    // Check balance
    const financialAccount = await stripe.treasury.financialAccounts.retrieve(
      user.financialAccountId,
      { stripeAccount: user.stripeAccountId }
    );

    const availableBalance = financialAccount.balance.cash.usd;
    if (availableBalance < amount) {
      return res.status(400).json({
        error: 'Insufficient funds',
        available: availableBalance,
        requested: amount
      });
    }

    // Determine destination
    let destination = destinationAccountId;
    if (!destination) {
      // Use default bank account
      const defaultAccount = user.externalAccounts.find(a => a.isDefault);
      if (!defaultAccount) {
        return res.status(400).json({ error: 'No bank account on file. Please add one first.' });
      }
      destination = defaultAccount.externalAccountId;
    }

    // Create Outbound Transfer
    const outboundTransfer = await stripe.treasury.outboundTransfers.create(
      {
        financial_account: user.financialAccountId,
        amount: Math.round(amount),
        currency: 'usd',
        destination_payment_method: destination,
        description: `VentureCast withdrawal to bank account`,
        metadata: {
          venturecast_user_id: user._id.toString(),
          type: 'withdrawal'
        }
      },
      { stripeAccount: user.stripeAccountId }
    );

    // Create transaction record
    const transaction = await Transaction.createWithdrawal(
      user._id,
      amount,
      outboundTransfer.id,
      destination
    );

    res.json({
      success: true,
      outboundTransferId: outboundTransfer.id,
      status: outboundTransfer.status,
      expectedArrival: outboundTransfer.expected_arrival_date,
      transaction: transaction
    });

  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TREASURY - Balance & Transfers
// ============================================

/**
 * GET /stripe/balance
 * Gets the user's Treasury financial account balance
 */
router.get('/balance', authenticateUser, async (req, res) => {
  try {
    const { user } = req;

    if (!user.financialAccountId || !user.stripeAccountId) {
      return res.json({
        available: 0,
        pending: 0,
        currency: 'usd',
        hasFinancialAccount: false
      });
    }

    const financialAccount = await stripe.treasury.financialAccounts.retrieve(
      user.financialAccountId,
      { stripeAccount: user.stripeAccountId }
    );

    // Update cached balance
    user.treasuryBalance.available = financialAccount.balance.cash.usd;
    user.treasuryBalance.pending = financialAccount.balance.inbound_pending.usd;
    await user.save();

    res.json({
      available: financialAccount.balance.cash.usd,
      pending: financialAccount.balance.inbound_pending.usd,
      outboundPending: financialAccount.balance.outbound_pending.usd,
      currency: 'usd',
      hasFinancialAccount: true,
      financialAccountId: user.financialAccountId
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /stripe/transfer
 * Internal transfer between user accounts (for trading)
 */
router.post('/transfer', authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { amount, description, metadata } = req.body;

    if (!user.financialAccountId) {
      return res.status(400).json({ error: 'No financial account' });
    }

    // Check balance
    const financialAccount = await stripe.treasury.financialAccounts.retrieve(
      user.financialAccountId,
      { stripeAccount: user.stripeAccountId }
    );

    if (financialAccount.balance.cash.usd < amount) {
      return res.status(400).json({
        error: 'Insufficient funds',
        available: financialAccount.balance.cash.usd
      });
    }

    const transactionId = new mongoose.Types.ObjectId();

    // Record the transfer
    const transaction = await Transaction.create({
      _id: transactionId,
      userId: user._id,
      type: 'TRANSFER_OUT',
      amount,
      status: 'completed',
      description: description || 'Trading transaction',
      metadata: metadata || {}
    });

    // Update cached balance
    user.treasuryBalance.available -= amount;
    await user.save();

    res.json({
      success: true,
      transactionId: transactionId,
      newBalance: user.treasuryBalance.available,
      transaction
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /stripe/transactions
 * Gets transaction history for the user
 */
router.get('/transactions', authenticateUser, async (req, res) => {
  try {
    const { user } = req;
    const { limit = 20, offset = 0, type } = req.query;

    const query = { userId: user._id };
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('streamerId', 'name ticker');

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// LEGACY - Create Payment Intent (keep for compatibility)
// ============================================
router.post('/create-payment-intent', async (req, res) => {
  const { amount, currency = 'usd', metadata = {} } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
    });
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
