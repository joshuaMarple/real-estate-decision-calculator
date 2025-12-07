# Bay Area Rent vs. Buy Calculator - Design Document

## Overview

An interactive web tool hosted on GitHub Pages that helps users determine the financial crossover point between renting and buying a home in the Bay Area. The tool accounts for California Proposition 13, which limits property tax increases and significantly impacts long-term ownership costs.

## Problem Statement

Standard rent vs. buy calculators fail to account for California-specific factors, particularly Prop 13's 2% annual cap on property tax increases. In a high-appreciation market like the Bay Area, this creates substantial long-term savings that generic calculators miss.

## Core Concept

- **Primary output:** Interactive graph showing two net worth trajectories over time
  - Line 1: Net worth if you buy (home equity + other investments)
  - Line 2: Net worth if you rent (invested down payment + invested monthly savings)
- **Key insight:** The crossover point where buying becomes more favorable than renting
- **Prop 13:** Baked into calculations (2% annual cap on 1.15% base rate)

## User Inputs

### Basic (always visible)

| Input | Description |
|-------|-------------|
| Purchase price | Target home price |
| Down payment | Percentage or dollar amount |
| Mortgage rate | Annual interest rate |
| Current monthly rent | What user pays now |
| Home appreciation rate | Expected annual increase in home value |
| Rent growth rate | Expected annual increase in rent |

### Advanced (hidden by default, expandable)

| Input | Default | Description |
|-------|---------|-------------|
| Investment return rate | 7% | Return on non-real-estate investments |
| Property tax rate | 1.15% | Base rate (Bay Area average) |
| HOA fees | $0 | Monthly HOA if applicable |
| Maintenance cost | 1% | Annual maintenance as % of home value |
| Tax bracket | TBD | For future tax deduction modeling |
| Filing status | TBD | For future tax deduction modeling |
| Homeowner's insurance | TBD | Annual premium |

### Time Horizon

- Adjustable via slider or zoom control
- Range: 1-30 years (or similar)

## Key Calculations

### Net Worth if Buying

```
Starting position: -down_payment - closing_costs

Each year:
- Home equity = home_value - remaining_mortgage
- Costs = mortgage_payment + property_tax + insurance + HOA + maintenance
- Property tax grows at 2%/year (Prop 13), not at appreciation rate

At exit: subtract selling costs (5-6% of home value)
```

### Net Worth if Renting

```
Starting position: +down_payment + closing_costs (invested)

Each year:
- Rent paid (grows at rent_growth_rate)
- Monthly savings/cost vs. owning → invested at investment_return_rate
- Initial lump sum compounds at investment_return_rate
```

### Prop 13 Modeling

- Year 1 assessed value = purchase price
- Each subsequent year: assessed value grows at max 2%
- Property tax = assessed value × tax rate (not market value × tax rate)

### Costs Included

| Cost | Included in v1? |
|------|-----------------|
| Closing costs (2-3% of purchase) | Yes |
| Selling costs (5-6% of sale price) | Yes |
| Mortgage interest deduction | No (conservative toward buying) |
| PMI (if <20% down) | Future consideration |

## Output

### Primary Visualization

- X-axis: Years (adjustable range)
- Y-axis: Net worth ($)
- Two lines: "Buy" and "Rent" trajectories
- Crossover point highlighted (if it exists within range)
- Tooltip on hover showing values at each year

### Secondary Output (v2+)

- Monthly cash flow comparison
- Prop 13 savings annotation (what taxes would be without it)

## Technical Approach

### Stack (v1)

- Plain HTML/CSS/JavaScript (no build step)
- Charting library (Chart.js, or similar lightweight option)
- Hosted on GitHub Pages

### URL State

- All inputs reflected in URL query parameters
- Enables sharing and bookmarking specific scenarios
- Example: `?price=1500000&down=20&rate=6.5&rent=4000`

### File Structure (proposed)

```
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── calculator.js    # Core calculation logic
│   ├── chart.js         # Visualization
│   ├── inputs.js        # Input handling & validation
│   └── url.js           # URL state management
└── DESIGN.md
```

## Versioning

### v1 - Minimal Viable Tool

- Basic inputs only
- Net worth graph with two lines
- Adjustable time horizon
- URL state for sharing
- Mobile-responsive layout

### v2 - Advanced Inputs

- Show/hide advanced inputs panel
- HOA, maintenance, insurance, property tax rate adjustments
- Investment return rate customization

### v3 - Enhanced Output

- Monthly cash flow comparison view
- Prop 13 savings annotation
- Scenario presets (conservative/moderate/aggressive appreciation)

### v4 - Tax Modeling

- Mortgage interest deduction
- SALT cap handling
- Itemization vs. standard deduction logic

### Future Considerations

- Multiple scenario comparison
- Sensitivity analysis
- Data integration (live mortgage rates, Zillow estimates)
- Framework migration if complexity warrants it

## Open Questions / Future Decisions

- Exact charting library choice
- Specific default values for insurance
- How to handle PMI for <20% down payment scenarios
- Mobile UX for sliders and graph interaction

## References

- California Proposition 13: 2% annual assessment cap, ~1% base tax rate
- Closing costs: typically 2-3% of purchase price
- Selling costs: typically 5-6% (agent commissions + fees)
