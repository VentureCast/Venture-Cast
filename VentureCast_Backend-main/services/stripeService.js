const Stripe = require('stripe');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

class StripeServiceError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================
// STRIPE CONNECT - Account Management
// ============================================

async function createConnectAccount(user) {
  if (user.stripeAccountId) {
    throw new StripeServiceError('User already has a Stripe account', 400, {
      stripeAccountId: user.stripeAccountId,
    });
  }

  const account = await stripe.accounts.create({
    type: 'custom',
    country: 'US',
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
      treasury: { requested: true },
    },
    business_type: 'individual',
    business_profile: {
      mcc: '6211',
      url: 'https://venturecast.app',
    },
    tos_acceptance: {
      service_agreement: 'full',
    },
    metadata: {
      venturecast_user_id: user._id.toString(),
    },
  });

  user.stripeAccountId = account.id;
  user.stripeAccountStatus = 'pending';
  user.onboardingStatus = 'not_started';
  await user.save();

  return { stripeAccountId: account.id };
}

async function createFinancialAccount(user) {
  if (!user.stripeAccountId) {
    throw new StripeServiceError('User must have a Stripe Connect account first', 400);
  }

  if (user.financialAccountId) {
    throw new StripeServiceError('User already has a financial account', 400, {
      financialAccountId: user.financialAccountId,
    });
  }

  const financialAccount = await stripe.treasury.financialAccounts.create(
    {
      supported_currencies: ['usd'],
      features: {
        card_issuing: { requested: true },
        deposit_insurance: { requested: true },
        financial_addresses: { aba: { requested: true } },
        inbound_transfers: { ach: { requested: true } },
        intra_stripe_flows: { requested: true },
        outbound_payments: {
          ach: { requested: true },
          us_domestic_wire: { requested: true },
        },
        outbound_transfers: {
          ach: { requested: true },
          us_domestic_wire: { requested: true },
        },
      },
      metadata: {
        venturecast_user_id: user._id.toString(),
      },
    },
    { stripeAccount: user.stripeAccountId }
  );

  user.financialAccountId = financialAccount.id;
  user.financialAccountStatus = financialAccount.status;
  user.treasuryStatus = 'active';
  await user.save();

  return {
    financialAccountId: financialAccount.id,
    status: financialAccount.status,
  };
}

async function generateOnboardingLink(user, returnUrl, refreshUrl) {
  if (!user.stripeAccountId) {
    throw new StripeServiceError('User must have a Stripe Connect account first', 400);
  }

  const accountLink = await stripe.accountLinks.create({
    account: user.stripeAccountId,
    refresh_url: refreshUrl || 'venturecast://stripe/refresh',
    return_url: returnUrl || 'venturecast://stripe/return',
    type: 'account_onboarding',
    collect: 'eventually_due',
  });

  user.onboardingStatus = 'in_progress';
  await user.save();

  return { url: accountLink.url, expiresAt: accountLink.expires_at };
}

async function getAccountStatus(user) {
  if (!user.stripeAccountId) {
    return {
      hasStripeAccount: false,
      onboardingStatus: 'not_started',
    };
  }

  const account = await stripe.accounts.retrieve(user.stripeAccountId);

  let balance = null;
  if (user.financialAccountId) {
    try {
      const financialAccount = await stripe.treasury.financialAccounts.retrieve(
        user.financialAccountId,
        { stripeAccount: user.stripeAccountId }
      );
      balance = financialAccount.balance;
    } catch (e) {
      logger.error('Error fetching financial account:', e);
    }
  }

  return {
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
    canTrade: account.charges_enabled && account.payouts_enabled && !!user.financialAccountId,
  };
}

// ============================================
// STRIPE CUSTOMER - Payment Methods
// ============================================

async function createCustomer(user) {
  if (user.stripeCustomerId) {
    return { customerId: user.stripeCustomerId, alreadyExists: true };
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      venturecast_user_id: user._id.toString(),
    },
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return { customerId: customer.id, alreadyExists: false };
}

async function createSetupIntent(user) {
  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { venturecast_user_id: user._id.toString() },
    });
    user.stripeCustomerId = customer.id;
    await user.save();
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: user.stripeCustomerId,
    payment_method_types: ['card'],
    metadata: {
      venturecast_user_id: user._id.toString(),
    },
  });

  return { clientSecret: setupIntent.client_secret, setupIntentId: setupIntent.id };
}

async function getPaymentMethods(user) {
  if (!user.stripeCustomerId) {
    return [];
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: 'card',
  });

  return paymentMethods.data.map((pm) => ({
    id: pm.id,
    type: pm.type,
    brand: pm.card?.brand,
    last4: pm.card?.last4,
    expMonth: pm.card?.exp_month,
    expYear: pm.card?.exp_year,
    isDefault: pm.id === user.defaultPaymentMethodId,
  }));
}

async function setDefaultPaymentMethod(user, paymentMethodId) {
  if (!user.stripeCustomerId) {
    throw new StripeServiceError('No customer account found', 400);
  }

  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  user.defaultPaymentMethodId = paymentMethodId;
  await user.save();

  return { defaultPaymentMethodId: paymentMethodId };
}

async function removePaymentMethod(user, paymentMethodId) {
  await stripe.paymentMethods.detach(paymentMethodId);

  if (user.defaultPaymentMethodId === paymentMethodId) {
    user.defaultPaymentMethodId = null;
    await user.save();
  }
}

// ============================================
// DEPOSITS
// ============================================

async function createDeposit(user, amount, paymentMethodId) {
  if (!amount || amount < 100) {
    throw new StripeServiceError('Minimum deposit is $1.00', 400);
  }

  if (!user.stripeCustomerId) {
    throw new StripeServiceError('No customer account. Please add a payment method first.', 400);
  }

  if (!user.financialAccountId) {
    throw new StripeServiceError('No financial account. Please complete onboarding first.', 400);
  }

  const paymentIntentParams = {
    amount: Math.round(amount),
    currency: 'usd',
    customer: user.stripeCustomerId,
    payment_method_types: ['card'],
    description: `VentureCast deposit for ${user.email}`,
    metadata: {
      venturecast_user_id: user._id.toString(),
      type: 'deposit',
      financial_account_id: user.financialAccountId,
    },
    transfer_data: {
      destination: user.stripeAccountId,
    },
  };

  if (paymentMethodId) {
    paymentIntentParams.payment_method = paymentMethodId;
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
  await Transaction.createDeposit(user._id, amount, paymentIntent.id);

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount,
  };
}

async function confirmDeposit(user, paymentIntentId) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== 'succeeded') {
    throw new StripeServiceError('Payment not completed', 400, {
      status: paymentIntent.status,
    });
  }

  const transaction = await Transaction.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    { status: 'completed', completedAt: new Date() },
    { new: true }
  );

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
      logger.error('Error updating balance:', e);
    }
  }

  return { transaction };
}

// ============================================
// WITHDRAWALS
// ============================================

async function addBankAccount(user, routingNumber, accountNumber, accountHolderName, accountHolderType) {
  if (!user.stripeAccountId) {
    throw new StripeServiceError('No Stripe account. Please complete onboarding.', 400);
  }

  const bankAccount = await stripe.accounts.createExternalAccount(user.stripeAccountId, {
    external_account: {
      object: 'bank_account',
      country: 'US',
      currency: 'usd',
      routing_number: routingNumber,
      account_number: accountNumber,
      account_holder_name: accountHolderName || user.name,
      account_holder_type: accountHolderType || 'individual',
    },
  });

  user.externalAccounts.push({
    externalAccountId: bankAccount.id,
    type: 'bank_account',
    last4: bankAccount.last4,
    bankName: bankAccount.bank_name,
    routingNumber: bankAccount.routing_number?.slice(-4),
    isDefault: user.externalAccounts.length === 0,
    status: bankAccount.status,
  });
  await user.save();

  return {
    id: bankAccount.id,
    last4: bankAccount.last4,
    bankName: bankAccount.bank_name,
    status: bankAccount.status,
  };
}

async function getBankAccounts(user) {
  if (!user.stripeAccountId) {
    return [];
  }

  const externalAccounts = await stripe.accounts.listExternalAccounts(user.stripeAccountId, {
    object: 'bank_account',
    limit: 10,
  });

  return externalAccounts.data.map((ba) => ({
    id: ba.id,
    last4: ba.last4,
    bankName: ba.bank_name,
    status: ba.status,
    isDefault: ba.default_for_currency,
  }));
}

async function createWithdrawal(user, amount, destinationAccountId) {
  if (!amount || amount < 100) {
    throw new StripeServiceError('Minimum withdrawal is $1.00', 400);
  }

  if (!user.financialAccountId) {
    throw new StripeServiceError('No financial account. Please complete onboarding.', 400);
  }

  const financialAccount = await stripe.treasury.financialAccounts.retrieve(
    user.financialAccountId,
    { stripeAccount: user.stripeAccountId }
  );

  const availableBalance = financialAccount.balance.cash.usd;
  if (availableBalance < amount) {
    throw new StripeServiceError('Insufficient funds', 400, {
      available: availableBalance,
      requested: amount,
    });
  }

  let destination = destinationAccountId;
  if (!destination) {
    const defaultAccount = user.externalAccounts.find((a) => a.isDefault);
    if (!defaultAccount) {
      throw new StripeServiceError('No bank account on file. Please add one first.', 400);
    }
    destination = defaultAccount.externalAccountId;
  }

  const outboundTransfer = await stripe.treasury.outboundTransfers.create(
    {
      financial_account: user.financialAccountId,
      amount: Math.round(amount),
      currency: 'usd',
      destination_payment_method: destination,
      description: 'VentureCast withdrawal to bank account',
      metadata: {
        venturecast_user_id: user._id.toString(),
        type: 'withdrawal',
      },
    },
    { stripeAccount: user.stripeAccountId }
  );

  const transaction = await Transaction.createWithdrawal(
    user._id,
    amount,
    outboundTransfer.id,
    destination
  );

  return {
    outboundTransferId: outboundTransfer.id,
    status: outboundTransfer.status,
    expectedArrival: outboundTransfer.expected_arrival_date,
    transaction,
  };
}

// ============================================
// TREASURY - Balance & Transfers
// ============================================

async function getBalance(user) {
  if (!user.financialAccountId || !user.stripeAccountId) {
    return {
      available: 0,
      pending: 0,
      currency: 'usd',
      hasFinancialAccount: false,
    };
  }

  const financialAccount = await stripe.treasury.financialAccounts.retrieve(
    user.financialAccountId,
    { stripeAccount: user.stripeAccountId }
  );

  user.treasuryBalance.available = financialAccount.balance.cash.usd;
  user.treasuryBalance.pending = financialAccount.balance.inbound_pending.usd;
  await user.save();

  return {
    available: financialAccount.balance.cash.usd,
    pending: financialAccount.balance.inbound_pending.usd,
    outboundPending: financialAccount.balance.outbound_pending.usd,
    currency: 'usd',
    hasFinancialAccount: true,
    financialAccountId: user.financialAccountId,
  };
}

async function createTransfer(user, amount, description, metadata) {
  if (!user.financialAccountId) {
    throw new StripeServiceError('No financial account', 400);
  }

  const financialAccount = await stripe.treasury.financialAccounts.retrieve(
    user.financialAccountId,
    { stripeAccount: user.stripeAccountId }
  );

  if (financialAccount.balance.cash.usd < amount) {
    throw new StripeServiceError('Insufficient funds', 400, {
      available: financialAccount.balance.cash.usd,
    });
  }

  const transactionId = new mongoose.Types.ObjectId();

  const transaction = await Transaction.create({
    _id: transactionId,
    userId: user._id,
    type: 'TRANSFER_OUT',
    amount,
    status: 'completed',
    description: description || 'Trading transaction',
    metadata: metadata || {},
  });

  user.treasuryBalance.available -= amount;
  await user.save();

  return {
    transactionId,
    newBalance: user.treasuryBalance.available,
    transaction,
  };
}

async function getTransactions(userId, limit = 20, offset = 0, type) {
  const query = { userId };
  if (type) {
    query.type = type;
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('streamerId', 'name ticker'),
    Transaction.countDocuments(query),
  ]);

  return { transactions, total, limit, offset };
}

async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
  });

  return { clientSecret: paymentIntent.client_secret };
}

module.exports = {
  StripeServiceError,
  createConnectAccount,
  createFinancialAccount,
  generateOnboardingLink,
  getAccountStatus,
  createCustomer,
  createSetupIntent,
  getPaymentMethods,
  setDefaultPaymentMethod,
  removePaymentMethod,
  createDeposit,
  confirmDeposit,
  addBankAccount,
  getBankAccounts,
  createWithdrawal,
  getBalance,
  createTransfer,
  getTransactions,
  createPaymentIntent,
};
