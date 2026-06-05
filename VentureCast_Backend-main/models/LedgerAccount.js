const mongoose = require('mongoose');

// Balance projection — one doc per accountKey, updated via $inc upserts (never .save()).
//
// accountKey conventions (all later phases MUST use the same templates — drift breaks
// balance reconstruction by summing LedgerEntry.delta across entries):
//
//   'user_cash:<userId>'            — user's spendable cash balance (unit: cents)
//   'user_pos:<userId>:<marketId>'  — user's share position in a market (unit: shares)
//   'market_reserve:<marketId>'     — market's reserve pool (unit: cents)
//   'platform_fees'                 — accumulated fee revenue (unit: cents)
//   'platform_funding'              — platform seed capital (unit: cents)
//                                     NOTE: this account is debited at every market genesis
//                                     and is upserted from 0, so it will run negative after
//                                     the first genesis. This is intentional — it represents
//                                     the platform's outstanding commitment and is a
//                                     bookkeeping artifact, not a solvency risk.
//
// <userId> and <marketId> are ObjectId.toString() (24-char hex strings).

const LedgerAccountSchema = new mongoose.Schema({
  // Composite key identifying the account — see convention table above
  accountKey: {
    type: String,
    required: true,
    unique: true,   // DB-enforced: one balance projection per account
    index: true
  },

  // Running balance — integer cents (for cash accounts) or integer units (for share accounts)
  // Updated exclusively via $inc findOneAndUpdate, never via .save()
  balance: {
    type: Number,
    required: true,
    default: 0
  },

  // Denomination of the balance field
  unit: {
    type: String,
    enum: ['cents', 'shares'],
    required: true
  },

  // Informational timestamp — updated by the $inc upsert via $set when convenient
  updatedAt: {
    type: Date,
    default: Date.now
  }

  // NO pre('save') hook — this model is updated via $inc findOneAndUpdate, not .save()
});

module.exports = mongoose.model('LedgerAccount', LedgerAccountSchema);
