// Shared Mongoose validators for AMM models.
//
// Money is ALWAYS integer cents and supply/qty is ALWAYS integer units across the
// entire AMM (see CLAUDE.md §1 ground truth). This validator enforces that invariant
// at the schema layer so a fractional value can never persist via `.save()`.
//
// NOTE: Mongoose does NOT run validators on `$inc` / `updateOne` by default, so this
// guards insert/`.save()` paths (Market, MarketState, LedgerEntry inserts). Projection
// balances mutated via `$inc` stay integer because every `delta` posted to LedgerEntry
// is itself integer-validated here — the source amounts are the guarded values.
//
// Later-phase models (Order, Trade, PriceCandle) MUST adopt `integerValidator` on their
// money/qty fields when their write paths are built in Phases 4–5 (codex re-audits there).

const integerValidator = {
  validator: Number.isInteger,
  message: (props) => `${props.path} must be an integer (got ${props.value})`,
};

module.exports = { integerValidator };
