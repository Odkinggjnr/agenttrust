# Trust Score Algorithm

## 1. Formula Overview

The AgentTrust trust score is a composite value from 0 to 10,000 (basis points), computed from five weighted components:

```
total = SR + V + A + AT + S
```

Where:

| Component | Symbol | Weight | Max Points |
|-----------|--------|--------|------------|
| Success Rate | SR | 40% | 4,000 |
| Volume | V | 20% | 2,000 |
| Age | A | 10% | 1,000 |
| Attestations | AT | 15% | 1,500 |
| Stake | S | 15% | 1,500 |
| **Total** | | **100%** | **10,000** |

The total is hard-capped at 10,000.

## 2. Success Rate Component (40%)

**Max: 4,000 points**

Measures the ratio of successful transactions to total transactions.

### Formula

```
SR = (successful_transactions / total_transactions) * 4000
```

### Edge Cases

- If `total_transactions == 0`, then `SR = 0`. A new agent with no transactions receives zero points for this component.
- Integer division is used: `(successful * 4000) / total`.

### Examples

| Successful | Total | Calculation | SR |
|-----------|-------|-------------|-----|
| 0 | 0 | 0 (no txns) | 0 |
| 1 | 1 | (1 * 4000) / 1 | 4,000 |
| 95 | 100 | (95 * 4000) / 100 | 3,800 |
| 475 | 500 | (475 * 4000) / 500 | 3,800 |
| 500 | 500 | (500 * 4000) / 500 | 4,000 |
| 1 | 10 | (1 * 4000) / 10 | 400 |

## 3. Volume Component (20%)

**Max: 2,000 points**

Measures total transaction volume using a logarithmic scale, rewarding early growth more than later growth.

### Formula

```
V = min(2000, integer_log10(volume_xlm + 1) * 400)
```

Where `volume_xlm = total_volume_stroops / 10,000,000` (converting from stroops to whole XLM).

The `integer_log10` function returns the number of digits minus one:
- `integer_log10(0) = 0`
- `integer_log10(1) = 0`
- `integer_log10(9) = 0`
- `integer_log10(10) = 1`
- `integer_log10(99) = 1`
- `integer_log10(100) = 2`
- `integer_log10(999) = 2`
- `integer_log10(1000) = 3`

### Worked Example

An agent with 1,000 XLM total volume:

```
volume_xlm = 1000
integer_log10(1000 + 1) = integer_log10(1001) = 3
V = min(2000, 3 * 400) = min(2000, 1200) = 1200
```

### Volume Progression

| Volume (XLM) | log10(v+1) | Raw Points | V (capped) |
|-------------|-----------|------------|-------------|
| 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 0 |
| 10 | 1 | 400 | 400 |
| 100 | 2 | 800 | 800 |
| 1,000 | 3 | 1,200 | 1,200 |
| 10,000 | 4 | 1,600 | 1,600 |
| 100,000 | 5 | 2,000 | 2,000 |
| 1,000,000 | 6 | 2,400 | 2,000 |

The component caps at 100,000 XLM of volume (5 digits -> 2,000 points).

## 4. Age Component (10%)

**Max: 1,000 points**

Measures how long the agent has been registered, rewarding longevity linearly.

### Formula

```
A = min(1000, days_since_registration * 2)
```

Where `days_since_registration = (current_timestamp - registered_at) / 86400`.

### Progression

| Days Registered | Calculation | A |
|----------------|-------------|---|
| 0 | 0 * 2 | 0 |
| 1 | 1 * 2 | 2 |
| 30 | 30 * 2 | 60 |
| 100 | 100 * 2 | 200 |
| 250 | 250 * 2 | 500 |
| 500 | min(1000, 500 * 2) | 1,000 |
| 1000 | min(1000, 1000 * 2) | 1,000 |

The component caps at **500 days** of registration.

## 5. Attestation Component (15%)

**Max: 1,500 points**

Measures third-party trust signals through attestations.

### Formula

```
AT = min(1500, attestation_count * 100)
```

Each non-revoked attestation contributes 100 points.

### Progression

| Attestations | Calculation | AT |
|-------------|-------------|-----|
| 0 | 0 * 100 | 0 |
| 1 | 1 * 100 | 100 |
| 5 | 5 * 100 | 500 |
| 10 | 10 * 100 | 1,000 |
| 15 | min(1500, 15 * 100) | 1,500 |
| 20 | min(1500, 20 * 100) | 1,500 |

The component caps at **15 attestations**.

## 6. Stake Component (15%)

**Max: 1,500 points**

Measures economic commitment through staked XLM.

### Formula

```
S = min(1500, floor(stake_xlm / 100) * 150)
```

Where `stake_xlm = stake_stroops / 10,000,000`.

Every 100 XLM staked contributes 150 points.

### Progression

| Stake (XLM) | floor(stake/100) | Raw Points | S (capped) |
|------------|-----------------|------------|-------------|
| 0 | 0 | 0 | 0 |
| 50 | 0 | 0 | 0 |
| 100 | 1 | 150 | 150 |
| 200 | 2 | 300 | 300 |
| 500 | 5 | 750 | 750 |
| 1,000 | 10 | 1,500 | 1,500 |
| 2,000 | 20 | 3,000 | 1,500 |

The component caps at **1,000 XLM** staked.

## 7. Decay

Inactive agents lose trust over time at a rate of **2% per week**.

### Formula

```
new_score = current_score * 0.98 ^ weeks_inactive
```

Where `weeks_inactive = floor((current_timestamp - last_activity_timestamp) / 604800)`.

Decay is applied via integer arithmetic: `new_score = new_score * 98 / 100` per week, iterating for each full week of inactivity.

### Decay Over Time

| Weeks Inactive | Multiplier | Score (starting at 10,000) |
|---------------|-----------|---------------------------|
| 0 | 1.000 | 10,000 |
| 1 | 0.980 | 9,800 |
| 4 | 0.922 | 9,223 |
| 10 | 0.817 | 8,171 |
| 20 | 0.668 | 6,676 |
| 30 | 0.545 | 5,454 |
| 50 | 0.364 | 3,641 |
| 100 | 0.133 | 1,326 |

### Recovery

Decay is reversed by recording new transactions. When a new transaction is recorded, the `last_activity` timestamp updates, stopping further decay. The next `calculate_score` call will recompute the full score from the agent's current statistics, which may result in a higher score than the decayed value.

## 8. Tier Thresholds

| Tier | Score Range | Typical Profile |
|------|-----------|-----------------|
| **Unverified** | 0 -- 2,000 | New agents, minimal activity, no attestations |
| **Emerging** | 2,001 -- 5,000 | Some transactions, building track record |
| **Established** | 5,001 -- 7,500 | Consistent success, moderate volume, some attestations |
| **Trusted** | 7,501 -- 9,000 | High success rate, significant volume, multiple attestations |
| **Elite** | 9,001 -- 10,000 | Near-perfect record, high volume, fully attested, maximum stake |

### Recommended Minimum Tiers by Use Case

| Use Case | Recommended Minimum |
|----------|-------------------|
| Public API access (low risk) | Unverified (0) |
| Paid API access (medium risk) | Emerging (2,001) |
| Financial data access | Established (5,001) |
| Transaction execution | Trusted (7,501) |
| Critical infrastructure | Elite (9,001) |

## 9. Worked Examples

### Example 1: Brand New Agent

An agent just registered with 1 successful transaction, 100 XLM stake, 1 day old, 0 attestations, 50 XLM volume.

```
SR = (1 / 1) * 4000                           = 4,000
V  = min(2000, integer_log10(50 + 1) * 400)   = min(2000, 1 * 400) = 400
A  = min(1000, 1 * 2)                         = 2
AT = min(1500, 0 * 100)                       = 0
S  = min(1500, floor(100 / 100) * 150)        = 150
---
Total = 4000 + 400 + 2 + 0 + 150              = 4,552
Tier  = Emerging
```

### Example 2: Established Agent

An agent with 500 transactions, 95% success rate (475 successful), 5,000 XLM volume, 200 days old, 10 attestations, 500 XLM stake.

```
SR = (475 / 500) * 4000                         = 3,800
V  = min(2000, integer_log10(5000 + 1) * 400)   = min(2000, 3 * 400) = 1,200
A  = min(1000, 200 * 2)                         = 400
AT = min(1500, 10 * 100)                        = 1,000
S  = min(1500, floor(500 / 100) * 150)          = 750
---
Total = 3800 + 1200 + 400 + 1000 + 750          = 7,150
Tier  = Established
```

### Example 3: Decayed Agent

An agent previously had a score of 8,000 but has been inactive for 8 weeks.

```
Decay: 8000 * 0.98^8

Week 1: 8000 * 98 / 100 = 7,840
Week 2: 7840 * 98 / 100 = 7,683
Week 3: 7683 * 98 / 100 = 7,529
Week 4: 7529 * 98 / 100 = 7,378
Week 5: 7378 * 98 / 100 = 7,230
Week 6: 7230 * 98 / 100 = 7,085
Week 7: 7085 * 98 / 100 = 6,943
Week 8: 6943 * 98 / 100 = 6,804

Final score: 6,804
Tier: Established (was Trusted)
```

Note: Due to integer truncation at each step, the result (6,804) differs slightly from `8000 * 0.98^8 = 6,829.36`. This is expected behavior.

### Example 4: Slashed Agent

An agent had a score of 8,500 and lost a dispute (non-fraud). The reputation is adjusted downward by 1,000 points.

```
Previous score: 8,500  (Trusted)
Adjustment:    -1,000
New score:      7,500  (Established)
Tier change:    Trusted -> Established

Additionally, 10% of their stake is slashed.
If they had 500 XLM staked: 50 XLM slashed, 450 XLM remaining.
Their stake component drops: floor(450/100) * 150 = 600 (was 750).
```
