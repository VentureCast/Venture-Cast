const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Transaction type
  type: {
    type: String,
    enum: ['DEPOSIT', 'WITHDRAW', 'BUY', 'SELL', 'TRANSFER_IN', 'TRANSFER_OUT', 'FEE', 'REFUND'],
    required: true
  },

  // Amount in cents (for precision)
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed'],
    default: 'pending'
  },

  // Stripe references
  stripePaymentIntentId: {
    type: String,
    default: null,
    index: true
  },
  stripeTransferId: {
    type: String,
    default: null
  },
  stripeOutboundTransferId: {
    type: String,
    default: null
  },
  stripeReceivedCreditId: {
    type: String,
    default: null
  },

  // For trading transactions
  streamerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Streamer',
    default: null
  },
  shareCount: {
    type: Number,
    default: null
  },
  sharePrice: {
    type: Number,
    default: null
  },

  // For withdrawals - destination
  destinationAccountId: {
    type: String,
    default: null
  },
  destinationType: {
    type: String,
    enum: ['bank_account', 'card', null],
    default: null
  },

  // Metadata
  description: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Fees
  platformFee: {
    type: Number,
    default: 0
  },
  stripeFee: {
    type: Number,
    default: 0
  },

  // Failure tracking
  failureCode: {
    type: String,
    default: null
  },
  failureMessage: {
    type: String,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
});

// Indexes
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ stripePaymentIntentId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1, createdAt: -1 });

// Pre-save middleware to update timestamp
TransactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Static method to create deposit transaction
TransactionSchema.statics.createDeposit = async function(userId, amount, paymentIntentId) {
  return this.create({
    userId,
    type: 'DEPOSIT',
    amount,
    status: 'pending',
    stripePaymentIntentId: paymentIntentId,
    description: `Deposit of $${(amount / 100).toFixed(2)}`
  });
};

// Static method to create withdrawal transaction
TransactionSchema.statics.createWithdrawal = async function(userId, amount, outboundTransferId, destinationId) {
  return this.create({
    userId,
    type: 'WITHDRAW',
    amount,
    status: 'pending',
    stripeOutboundTransferId: outboundTransferId,
    destinationAccountId: destinationId,
    description: `Withdrawal of $${(amount / 100).toFixed(2)}`
  });
};

// Static method to create trade transaction
TransactionSchema.statics.createTrade = async function(userId, type, streamerId, shareCount, sharePrice, amount) {
  return this.create({
    userId,
    type,
    streamerId,
    shareCount,
    sharePrice,
    amount,
    status: 'completed',
    description: `${type} ${shareCount} shares at $${sharePrice.toFixed(2)}`
  });
};

module.exports = mongoose.model('Transaction', TransactionSchema);
