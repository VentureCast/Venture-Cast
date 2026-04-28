const Joi = require('joi');

const depositSchema = Joi.object({
  amount: Joi.number().integer().min(100).max(10000000).required(),
  paymentMethodId: Joi.string().pattern(/^pm_/).optional(),
});

const confirmDepositSchema = Joi.object({
  paymentIntentId: Joi.string().pattern(/^pi_/).required(),
});

const withdrawSchema = Joi.object({
  amount: Joi.number().integer().min(100).max(10000000).required(),
  destinationAccountId: Joi.string().optional(),
});

const addBankSchema = Joi.object({
  routingNumber: Joi.string().length(9).pattern(/^\d+$/).required(),
  accountNumber: Joi.string().min(4).max(17).required(),
  accountHolderName: Joi.string().max(100).optional(),
  accountHolderType: Joi.string().valid('individual', 'company').optional(),
});

const onboardingLinkSchema = Joi.object({
  returnUrl: Joi.string().uri().optional(),
  refreshUrl: Joi.string().uri().optional(),
});

const paymentMethodIdBody = Joi.object({
  paymentMethodId: Joi.string().required(),
});

const paymentMethodIdParam = Joi.object({
  id: Joi.string().required(),
});

const transferSchema = Joi.object({
  amount: Joi.number().integer().min(1).required(),
  description: Joi.string().max(200).optional(),
  metadata: Joi.object().optional(),
});

const transactionsQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  type: Joi.string().valid('DEPOSIT', 'WITHDRAW', 'BUY', 'SELL', 'TRANSFER_IN', 'TRANSFER_OUT').optional(),
});

const createPaymentIntentSchema = Joi.object({
  amount: Joi.number().integer().min(1).required(),
  currency: Joi.string().length(3).default('usd'),
  metadata: Joi.object().optional(),
});

module.exports = {
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
};
