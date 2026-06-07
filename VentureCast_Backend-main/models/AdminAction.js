const mongoose = require('mongoose');

// Immutable audit record for admin operations — written once; never updated.
//
// action values (non-exhaustive — new actions may be added as admin routes are implemented):
//   'create_market'           — new market opened via genesis
//   'pause_market'            — market.status set to 'paused'
//   'resume_market'           — market.status set to 'active'
//   'set_tier'                — market.tier changed
//   'circuit_breaker_halt'    — circuit breaker manually engaged
//   'circuit_breaker_resume'  — circuit breaker manually released
//
// target is typically marketId.toString() but may be a userId or other identifier
// depending on the action.
//
// before/after capture the state of the affected document before and after the action,
// as a Mixed snapshot — useful for audit diffing.

const AdminActionSchema = new mongoose.Schema({
  // Admin user who performed the action
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Action identifier — see action values above
  action: {
    type: String,
    required: true
  },

  // Target entity identifier — typically marketId.toString() (24-char hex)
  target: {
    type: String,
    required: true
  },

  // State snapshot before the action — null if not applicable
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // State snapshot after the action — null if not applicable
  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Insert timestamp — indexed for both audit query patterns below
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }

  // NO updatedAt — admin actions are immutable audit records
  // NO pre('save') hook
});

// Audit query indexes
AdminActionSchema.index({ adminId: 1, createdAt: -1 });  // actions by a specific admin
AdminActionSchema.index({ action: 1, createdAt: -1 });   // aggregate by action type

module.exports = mongoose.model('AdminAction', AdminActionSchema);
