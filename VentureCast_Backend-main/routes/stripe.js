const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const stripeController = require('../controllers/stripeController');
const validate = require('../middleware/validate');
const {
  depositSchema,
  confirmDepositSchema,
  withdrawSchema,
  addBankSchema,
  onboardingLinkSchema,
  paymentMethodIdBody,
  paymentMethodIdParam,
  transferSchema,
  transactionsQuery,
  createPaymentIntentSchema,
} = require('../middleware/schemas/stripeSchemas');

// Stripe Connect - Account Management
router.post('/create-account', authenticateToken, stripeController.createAccount);
router.post('/create-financial-account', authenticateToken, stripeController.createFinancialAccount);
router.post('/onboarding-link', authenticateToken, validate(onboardingLinkSchema), stripeController.onboardingLink);
router.get('/account-status', authenticateToken, stripeController.accountStatus);

// Stripe Customer - Payment Methods
router.post('/create-customer', authenticateToken, stripeController.createCustomer);
router.post('/setup-intent', authenticateToken, stripeController.setupIntent);
router.get('/payment-methods', authenticateToken, stripeController.paymentMethods);
router.post('/set-default-payment-method', authenticateToken, validate(paymentMethodIdBody), stripeController.setDefaultPaymentMethod);
router.delete('/payment-method/:id', authenticateToken, validate(paymentMethodIdParam, 'params'), stripeController.removePaymentMethod);

// Deposits
router.post('/deposit', authenticateToken, validate(depositSchema), stripeController.deposit);
router.post('/confirm-deposit', authenticateToken, validate(confirmDepositSchema), stripeController.confirmDeposit);

// Withdrawals
router.post('/add-bank-account', authenticateToken, validate(addBankSchema), stripeController.addBankAccount);
router.get('/bank-accounts', authenticateToken, stripeController.bankAccounts);
router.post('/withdraw', authenticateToken, validate(withdrawSchema), stripeController.withdraw);

// Treasury - Balance & Transfers
router.get('/balance', authenticateToken, stripeController.balance);
router.post('/transfer', authenticateToken, validate(transferSchema), stripeController.transfer);
router.get('/transactions', authenticateToken, validate(transactionsQuery, 'query'), stripeController.transactions);

// Legacy
router.post('/create-payment-intent', validate(createPaymentIntentSchema), stripeController.createPaymentIntent);

module.exports = router;
