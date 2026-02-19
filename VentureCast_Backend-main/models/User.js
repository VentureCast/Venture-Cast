const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // ============================================
  // BASIC USER INFORMATION
  // ============================================
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for OAuth users
  googleId: { type: String, required: false },
  appleId: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },

  // ============================================
  // STRIPE CONNECT - Custom Account
  // ============================================
  stripeAccountId: {
    type: String,
    default: null,
    index: true
  },
  stripeAccountStatus: {
    type: String,
    enum: ['pending', 'enabled', 'restricted', 'disabled', null],
    default: null
  },
  stripeAccountType: {
    type: String,
    enum: ['custom', 'express', 'standard', null],
    default: 'custom'
  },

  // ============================================
  // STRIPE CUSTOMER - For accepting payments
  // ============================================
  stripeCustomerId: {
    type: String,
    default: null,
    index: true
  },
  defaultPaymentMethodId: {
    type: String,
    default: null
  },

  // ============================================
  // STRIPE TREASURY - Financial Account
  // ============================================
  financialAccountId: {
    type: String,
    default: null,
    index: true
  },
  financialAccountStatus: {
    type: String,
    enum: ['open', 'closed', 'restricted', null],
    default: null
  },

  // ============================================
  // KYC/ONBOARDING STATUS
  // ============================================
  onboardingStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'pending_verification', 'completed', 'failed'],
    default: 'not_started'
  },
  onboardingCompletedAt: {
    type: Date,
    default: null
  },
  kycVerificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'failed'],
    default: 'unverified'
  },
  kycRequirements: {
    currentlyDue: [{ type: String }],
    eventuallyDue: [{ type: String }],
    pastDue: [{ type: String }],
    pendingVerification: [{ type: String }]
  },

  // ============================================
  // TREASURY STATUS & BALANCE
  // ============================================
  treasuryStatus: {
    type: String,
    enum: ['inactive', 'active', 'suspended', null],
    default: null
  },
  treasuryBalance: {
    available: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' }
  },

  // ============================================
  // PORTFOLIO (existing)
  // ============================================
  portfolio: [
    {
      streamerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Streamer',
        required: true
      },
      sharesOwned: { type: Number, required: true },
      averageCost: { type: Number, required: true },
    },
  ],

  // ============================================
  // TRANSACTIONS (extended)
  // ============================================
  transactions: [
    {
      transactionId: { type: mongoose.Schema.Types.ObjectId, required: true },
      streamerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Streamer',
        required: false
      },
      transactionType: {
        type: String,
        enum: ['BUY', 'SELL', 'DEPOSIT', 'WITHDRAW', 'TRANSFER_IN', 'TRANSFER_OUT'],
        required: true
      },
      sharePrice: { type: Number, required: false },
      shareCount: { type: Number, required: false },
      amount: { type: Number, required: false },
      currency: { type: String, default: 'usd' },
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending'
      },
      stripePaymentIntentId: { type: String, default: null },
      stripeTransferId: { type: String, default: null },
      transactionDate: { type: Date, default: Date.now },
    },
  ],

  // ============================================
  // PAYMENT METHODS
  // ============================================
  paymentMethods: [
    {
      paymentMethodId: { type: String, required: true },
      type: { type: String, required: true },
      last4: { type: String },
      brand: { type: String },
      expMonth: { type: Number },
      expYear: { type: Number },
      isDefault: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // ============================================
  // EXTERNAL BANK ACCOUNTS (for withdrawals)
  // ============================================
  externalAccounts: [
    {
      externalAccountId: { type: String, required: true },
      type: { type: String, enum: ['bank_account', 'card'], required: true },
      last4: { type: String },
      bankName: { type: String },
      routingNumber: { type: String },
      isDefault: { type: Boolean, default: false },
      status: { type: String, enum: ['new', 'validated', 'verified', 'errored'] },
      createdAt: { type: Date, default: Date.now }
    }
  ]
});

// Indexes
UserSchema.index({ stripeAccountId: 1 });
UserSchema.index({ stripeCustomerId: 1 });
UserSchema.index({ financialAccountId: 1 });
UserSchema.index({ email: 1 });

// Virtual for checking if user can trade
UserSchema.virtual('canTrade').get(function() {
  return this.onboardingStatus === 'completed' &&
         this.kycVerificationStatus === 'verified' &&
         this.treasuryStatus === 'active';
});

// Virtual for available trading balance
UserSchema.virtual('availableBalance').get(function() {
  return this.treasuryBalance?.available || 0;
});

// Method to update treasury balance
UserSchema.methods.updateTreasuryBalance = async function(available, pending) {
  this.treasuryBalance.available = available;
  this.treasuryBalance.pending = pending;
  await this.save();
};

module.exports = mongoose.model('User', UserSchema);
