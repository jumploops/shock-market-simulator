## CrashMirror assumptions (v0.1)

- Scope is U.S.-centric with 2025 purchasing power as the benchmark.
- Cash is split into FDIC-insured vs. uninsured deposits; insured balances are treated as risk-free unless users override.
- Bonds and credit shocks assume broad index duration with no active hedging.
- Real estate inputs represent market value before debt; mortgages stay at face value (no forced refinancing modeled).
- Margin debt is static; margin calls and forced selling are not simulated in v1.
- Gold pricing reflects U.S. dollar moves; 1934 revaluation is an explicit toggle for Scenario A.
- "Real" view divides nominal results by CPI-style adjustments tied to each scenario's horizon.
- Advanced splits override the simple buckets; any remainder is spread evenly across the mapped assets.
