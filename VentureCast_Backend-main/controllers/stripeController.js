const stripeService = require('../services/stripeService');
const { StripeServiceError } = stripeService;
const logger = require('../utils/logger');

function handleError(res, error, fallbackMessage) {
  if (error instanceof StripeServiceError) {
    return res.status(error.statusCode).json({ error: error.message, ...error.details });
  }
  logger.error(`${fallbackMessage}:`, error);
  res.status(500).json({ error: error.message });
}

// ============================================
// STRIPE CONNECT
// ============================================

async function createAccount(req, res) {
  try {
    const result = await stripeService.createConnectAccount(req.user);
    res.status(201).json({ success: true, ...result, message: 'Stripe Connect account created successfully' });
  } catch (error) {
    handleError(res, error, 'Create account error');
  }
}

async function createFinancialAccount(req, res) {
  try {
    const result = await stripeService.createFinancialAccount(req.user);
    res.status(201).json({ success: true, ...result, message: 'Treasury Financial Account created successfully' });
  } catch (error) {
    handleError(res, error, 'Create financial account error');
  }
}

async function onboardingLink(req, res) {
  try {
    const { returnUrl, refreshUrl } = req.body;
    const result = await stripeService.generateOnboardingLink(req.user, returnUrl, refreshUrl);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error, 'Onboarding link error');
  }
}

async function accountStatus(req, res) {
  try {
    const result = await stripeService.getAccountStatus(req.user);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Account status error');
  }
}

// ============================================
// STRIPE CUSTOMER
// ============================================

async function createCustomer(req, res) {
  try {
    const result = await stripeService.createCustomer(req.user);
    const status = result.alreadyExists ? 200 : 201;
    const message = result.alreadyExists ? 'Customer already exists' : 'Customer created successfully';
    res.status(status).json({ success: true, customerId: result.customerId, message });
  } catch (error) {
    handleError(res, error, 'Create customer error');
  }
}

async function setupIntent(req, res) {
  try {
    const result = await stripeService.createSetupIntent(req.user);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error, 'Setup intent error');
  }
}

async function paymentMethods(req, res) {
  try {
    const methods = await stripeService.getPaymentMethods(req.user);
    res.json({ paymentMethods: methods });
  } catch (error) {
    handleError(res, error, 'List payment methods error');
  }
}

async function setDefaultPaymentMethod(req, res) {
  try {
    const result = await stripeService.setDefaultPaymentMethod(req.user, req.body.paymentMethodId);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error, 'Set default payment method error');
  }
}

async function removePaymentMethod(req, res) {
  try {
    await stripeService.removePaymentMethod(req.user, req.params.id);
    res.json({ success: true, message: 'Payment method removed' });
  } catch (error) {
    handleError(res, error, 'Delete payment method error');
  }
}

// ============================================
// DEPOSITS
// ============================================

async function deposit(req, res) {
  try {
    const { amount, paymentMethodId } = req.body;
    const result = await stripeService.createDeposit(req.user, amount, paymentMethodId);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error, 'Deposit error');
  }
}

async function confirmDeposit(req, res) {
  try {
    const result = await stripeService.confirmDeposit(req.user, req.body.paymentIntentId);
    res.json({ success: true, ...result, message: 'Deposit confirmed' });
  } catch (error) {
    handleError(res, error, 'Confirm deposit error');
  }
}

// ============================================
// WITHDRAWALS
// ============================================

async function addBankAccount(req, res) {
  try {
    const { routingNumber, accountNumber, accountHolderName, accountHolderType } = req.body;
    const result = await stripeService.addBankAccount(
      req.user, routingNumber, accountNumber, accountHolderName, accountHolderType
    );
    res.status(201).json({ success: true, bankAccount: result });
  } catch (error) {
    handleError(res, error, 'Add bank account error');
  }
}

async function bankAccounts(req, res) {
  try {
    const accounts = await stripeService.getBankAccounts(req.user);
    res.json({ bankAccounts: accounts });
  } catch (error) {
    handleError(res, error, 'List bank accounts error');
  }
}

async function withdraw(req, res) {
  try {
    const { amount, destinationAccountId } = req.body;
    const result = await stripeService.createWithdrawal(req.user, amount, destinationAccountId);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error, 'Withdraw error');
  }
}

// ============================================
// TREASURY
// ============================================

async function balance(req, res) {
  try {
    const result = await stripeService.getBalance(req.user);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Get balance error');
  }
}

async function transfer(req, res) {
  try {
    const { amount, description, metadata } = req.body;
    const result = await stripeService.createTransfer(req.user, amount, description, metadata);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error, 'Transfer error');
  }
}

async function transactions(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const result = await stripeService.getTransactions(req.user._id, limit, offset, req.query.type);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Get transactions error');
  }
}

async function createPaymentIntent(req, res) {
  try {
    const { amount, currency, metadata } = req.body;
    const result = await stripeService.createPaymentIntent(amount, currency, metadata);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  createAccount,
  createFinancialAccount,
  onboardingLink,
  accountStatus,
  createCustomer,
  setupIntent,
  paymentMethods,
  setDefaultPaymentMethod,
  removePaymentMethod,
  deposit,
  confirmDeposit,
  addBankAccount,
  bankAccounts,
  withdraw,
  balance,
  transfer,
  transactions,
  createPaymentIntent,
};
