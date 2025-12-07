// Core calculation logic for rent vs. buy comparison

export interface CalculatorInputs {
    // Basic inputs (v1)
    purchasePrice: number;
    downPaymentPercent: number;
    mortgageRate: number; // Annual rate as decimal (e.g., 0.065 for 6.5%)
    monthlyRent: number;
    homeAppreciationRate: number; // Annual rate as decimal
    rentGrowthRate: number; // Annual rate as decimal

    // Advanced inputs with defaults (v2+)
    investmentReturnRate: number; // Default 7%
    propertyTaxRate: number; // Default 1.15%
    hoaMonthly: number; // Default $0
    maintenanceRate: number; // Default 1% of home value
    closingCostRate: number; // Default 2.5%
    sellingCostRate: number; // Default 6%
    insuranceAnnual: number; // Default 0.35% of home value
}

export interface YearlyData {
    year: number;
    buyNetWorth: number;
    rentNetWorth: number;
    // Additional details for tooltips
    homeValue: number;
    mortgageBalance: number;
    homeEquity: number;
    rentingInvestments: number;
    annualRent: number;
    annualOwnershipCost: number;
}

export const DEFAULT_INPUTS: Partial<CalculatorInputs> = {
    investmentReturnRate: 0.07,
    propertyTaxRate: 0.0115,
    hoaMonthly: 0,
    maintenanceRate: 0.01,
    closingCostRate: 0.025,
    sellingCostRate: 0.06,
    insuranceAnnual: 0, // Will be calculated as % of home value if 0
};

// Calculate monthly mortgage payment (principal + interest)
export function calculateMonthlyMortgage(
    principal: number,
    annualRate: number,
    years: number = 30
): number {
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    if (monthlyRate === 0) {
        return principal / numPayments;
    }

    return (
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
    );
}

// Calculate remaining mortgage balance after n months
export function calculateMortgageBalance(
    principal: number,
    annualRate: number,
    monthsPaid: number,
    years: number = 30
): number {
    const monthlyRate = annualRate / 12;
    const monthlyPayment = calculateMonthlyMortgage(principal, annualRate, years);

    if (monthlyRate === 0) {
        return principal - monthlyPayment * monthsPaid;
    }

    const balance =
        principal * Math.pow(1 + monthlyRate, monthsPaid) -
        (monthlyPayment * (Math.pow(1 + monthlyRate, monthsPaid) - 1)) / monthlyRate;

    return Math.max(0, balance);
}

// Calculate property tax with Prop 13 (2% annual cap on assessed value increase)
export function calculateProp13Tax(
    purchasePrice: number,
    year: number,
    taxRate: number
): number {
    // Assessed value can only increase 2% per year under Prop 13
    const assessedValue = purchasePrice * Math.pow(1.02, year);
    return assessedValue * taxRate;
}

// Main calculation function
export function calculateNetWorth(
    inputs: CalculatorInputs,
    years: number
): YearlyData[] {
    const results: YearlyData[] = [];

    const downPayment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
    const loanAmount = inputs.purchasePrice - downPayment;
    const closingCosts = inputs.purchasePrice * inputs.closingCostRate;
    const monthlyMortgage = calculateMonthlyMortgage(loanAmount, inputs.mortgageRate);

    // Insurance: if not specified, estimate as 0.35% of home value
    const getAnnualInsurance = (homeValue: number) =>
        inputs.insuranceAnnual > 0 ? inputs.insuranceAnnual : homeValue * 0.0035;

    // Year 0: Initial state
    const initialHomeValue = inputs.purchasePrice;

    // Renter starts with down payment + closing costs invested
    let rentingInvestments = downPayment + closingCosts;
    let currentMonthlyRent = inputs.monthlyRent;

    // Add year 0: "If I sold today, what would I net?"
    const initialSellingCosts = initialHomeValue * inputs.sellingCostRate;
    results.push({
        year: 0,
        buyNetWorth: downPayment - initialSellingCosts - closingCosts,
        rentNetWorth: rentingInvestments,
        homeValue: initialHomeValue,
        mortgageBalance: loanAmount,
        homeEquity: downPayment,
        rentingInvestments: rentingInvestments,
        annualRent: 0,
        annualOwnershipCost: closingCosts,
    });

    for (let year = 1; year <= years; year++) {
        // Home value appreciates
        const homeValue = inputs.purchasePrice * Math.pow(1 + inputs.homeAppreciationRate, year);

        // Mortgage balance after payments
        const mortgageBalance = calculateMortgageBalance(
            loanAmount,
            inputs.mortgageRate,
            year * 12
        );

        // Annual ownership costs
        const annualMortgage = monthlyMortgage * 12;
        const annualPropertyTax = calculateProp13Tax(
            inputs.purchasePrice,
            year - 1, // Tax based on prior year assessment
            inputs.propertyTaxRate
        );
        const annualHoa = inputs.hoaMonthly * 12;
        const annualMaintenance = homeValue * inputs.maintenanceRate;
        const annualInsurance = getAnnualInsurance(homeValue);

        const annualOwnershipCost =
            annualMortgage + annualPropertyTax + annualHoa + annualMaintenance + annualInsurance;

        // Home equity (before selling costs)
        const homeEquity = homeValue - mortgageBalance;

        // Net worth if selling: equity minus selling costs
        const sellingCosts = homeValue * inputs.sellingCostRate;
        const buyNetWorth = homeEquity - sellingCosts - closingCosts;

        // Renter calculations
        const annualRent = currentMonthlyRent * 12;

        // Monthly cash flow difference: what renter saves (or loses) vs owner
        // Positive = renter saves money, negative = owner saves money
        const monthlyOwnershipCost = annualOwnershipCost / 12;
        const monthlySavings = monthlyOwnershipCost - currentMonthlyRent;

        // Renter's investments grow and add monthly savings
        // Compound monthly for accuracy
        for (let month = 0; month < 12; month++) {
            // Add monthly savings (can be negative if renting costs more)
            rentingInvestments += monthlySavings;
            // Investments grow monthly
            rentingInvestments *= 1 + inputs.investmentReturnRate / 12;
        }

        results.push({
            year,
            buyNetWorth,
            rentNetWorth: rentingInvestments,
            homeValue,
            mortgageBalance,
            homeEquity,
            rentingInvestments,
            annualRent,
            annualOwnershipCost,
        });

        // Rent increases for next year
        currentMonthlyRent *= 1 + inputs.rentGrowthRate;
    }

    return results;
}

// Find the crossover point (year where buying becomes better than renting)
export function findCrossoverYear(data: YearlyData[]): number | null {
    for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1];
        const curr = data[i];

        // Check if lines crossed
        if (prev.buyNetWorth <= prev.rentNetWorth && curr.buyNetWorth > curr.rentNetWorth) {
            // Linear interpolation to estimate exact crossover
            const ratio =
                (prev.rentNetWorth - prev.buyNetWorth) /
                (curr.buyNetWorth - curr.rentNetWorth + prev.rentNetWorth - prev.buyNetWorth);
            return prev.year + ratio;
        }
    }
    return null;
}
