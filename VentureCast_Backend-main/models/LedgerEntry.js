const mongoose = require('mongoose');
const { integerValidator } = require('./ammValidators');

// Immutable double-entry posting — append-only; never updated after insert.
//
// Delta sign convention (all later phases MUST follow the same convention):
//   positive delta = credit  (money/shares entering the account)
//   negative delta = debit   (money/shares leaving the account)
//
// Every set of entries for a single economic event MUST sum to exactly zero
// across all involved accounts (double-entry invariant).
//
// Examples:
//   Genesis: platform_funding delta=-10000, market_reserve:<id> delta=+10000  → sum=0
//   Buy:     user_cash delta=-grossCents, market_reserve delta=+(grossCents-fee-spread),
//            platform_fees delta=+feeCents, market_reserve delta=+spreadCents  → sum=0

const LedgerEntrySchema = new mongoose.Schema({
  // Trade that generated this posting — null for genesis/funding entries
  tradeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade',
    default: null,
    index: true
  },

  // Target account key — must match one of the accountKey conventions in LedgerAccount.js
  accountKey: {
    type: String,
    required: true,
    index: true
  },

  // Signed amount — positive = credit, negative = debit (see sign convention above)
  // Integer cents for cash accounts; integer units for share/position accounts
  delta: {
    type: Number,
    required: true,
    validate: integerValidator
  },

  // Denomination of the delta field
  unit: {
    type: String,
    enum: ['cents', 'shares'],
    required: true
  },

  // Human-readable note for audit/debugging — e.g. 'genesis debit for market <id>'
  note: {
    type: String,
    default: null
  },

  // Insert timestamp — indexed for balance reconstruction queries
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }

  // NO updatedAt — entries are immutable after insert
  // NO pre('save') hook
});

// Fetch all entries for a given trade to verify sum == 0
LedgerEntrySchema.index({ tradeId: 1 });

// Rebuild balance by summing entries newest-first for a given account
LedgerEntrySchema.index({ accountKey: 1, createdAt: -1 });

module.exports = mongoose.model('LedgerEntry', LedgerEntrySchema);
