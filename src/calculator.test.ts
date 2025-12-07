import {
    calculateMonthlyMortgage,
    calculateMortgageBalance,
    calculateNetWorth,
    findCrossoverYear,
    CalculatorInputs,
} from './calculator';

describe('calculateMonthlyMortgage', () => {
    it('calculates correctly for a standard 30-year mortgage', () => {
        // $1M loan at 6% for 30 years should be ~$5,996/month
        const monthly = calculateMonthlyMortgage(1000000, 0.06, 30);
        expect(monthly).toBeCloseTo(5995.51, 0);
    });

    it('calculates correctly for a 15-year mortgage', () => {
        // $500k loan at 5% for 15 years should be ~$3,954/month
        const monthly = calculateMonthlyMortgage(500000, 0.05, 15);
        expect(monthly).toBeCloseTo(3953.97, 0);
    });

    it('handles zero interest rate', () => {
        const monthly = calculateMonthlyMortgage(360000, 0, 30);
        expect(monthly).toBe(1000); // $360k / 360 months
    });
});

describe('calculateMortgageBalance', () => {
    it('returns full principal at month 0', () => {
        const balance = calculateMortgageBalance(1000000, 0.06, 0, 30);
        expect(balance).toBe(1000000);
    });

    it('decreases over time', () => {
        const balance12 = calculateMortgageBalance(1000000, 0.06, 12, 30);
        const balance24 = calculateMortgageBalance(1000000, 0.06, 24, 30);
        expect(balance12).toBeLessThan(1000000);
        expect(balance24).toBeLessThan(balance12);
    });

    it('reaches zero at end of term', () => {
        const balance = calculateMortgageBalance(1000000, 0.06, 360, 30);
        expect(balance).toBeCloseTo(0, 0);
    });
});

describe('calculateNetWorth', () => {
    const baseInputs: CalculatorInputs = {
        purchasePrice: 1500000,
        downPaymentPercent: 20,
        mortgageRate: 0.065,
        monthlyRent: 4000,
        homeAppreciationRate: 0.04,
        rentGrowthRate: 0.03,
        investmentReturnRate: 0.07,
        propertyTaxRate: 0.0115,
        hoaMonthly: 0,
        maintenanceRate: 0.01,
        closingCostRate: 0.025,
        sellingCostRate: 0.06,
        insuranceAnnual: 0,
    };

    it('returns correct number of years', () => {
        const data = calculateNetWorth(baseInputs, 10);
        expect(data.length).toBe(11); // Years 0-10
    });

    it('year 0 buy net worth accounts for closing and selling costs', () => {
        const data = calculateNetWorth(baseInputs, 5);
        const year0 = data[0];

        // Down payment: $300k, Closing: $37.5k, Selling: $90k
        // Buy net worth = $300k - $90k - $37.5k = $172.5k
        expect(year0.buyNetWorth).toBeCloseTo(172500, -2);
    });

    it('year 0 rent net worth equals down payment + closing costs', () => {
        const data = calculateNetWorth(baseInputs, 5);
        const year0 = data[0];

        // Renter keeps: $300k + $37.5k = $337.5k
        expect(year0.rentNetWorth).toBeCloseTo(337500, -2);
    });

    it('home value appreciates correctly', () => {
        const data = calculateNetWorth(baseInputs, 5);

        expect(data[0].homeValue).toBe(1500000);
        expect(data[1].homeValue).toBeCloseTo(1500000 * 1.04, 0);
        expect(data[5].homeValue).toBeCloseTo(1500000 * Math.pow(1.04, 5), 0);
    });

    it('mortgage balance decreases over time', () => {
        const data = calculateNetWorth(baseInputs, 10);

        for (let i = 1; i < data.length; i++) {
            expect(data[i].mortgageBalance).toBeLessThan(data[i - 1].mortgageBalance);
        }
    });

    it('home equity increases over time with appreciation', () => {
        const data = calculateNetWorth(baseInputs, 10);

        for (let i = 1; i < data.length; i++) {
            expect(data[i].homeEquity).toBeGreaterThan(data[i - 1].homeEquity);
        }
    });

    it('annual rent increases at rent growth rate', () => {
        const data = calculateNetWorth(baseInputs, 5);

        // Year 1 rent = $4000 * 12 = $48000
        expect(data[1].annualRent).toBeCloseTo(48000, 0);

        // Year 2 rent = $4000 * 1.03 * 12 = $49,440
        expect(data[2].annualRent).toBeCloseTo(48000 * 1.03, 0);
    });
});

describe('user scenario: high rent growth', () => {
    const inputs: CalculatorInputs = {
        purchasePrice: 1500000,
        downPaymentPercent: 10,
        mortgageRate: 0.065,
        monthlyRent: 4500,
        homeAppreciationRate: 0.055,
        rentGrowthRate: 0.07,
        investmentReturnRate: 0.07,
        propertyTaxRate: 0.0115,
        hoaMonthly: 0,
        maintenanceRate: 0.01,
        closingCostRate: 0.025,
        sellingCostRate: 0.06,
        insuranceAnnual: 0,
    };

    it('calculates year 0 correctly', () => {
        const data = calculateNetWorth(inputs, 8);
        const year0 = data[0];

        // Down payment: $150k, Closing: $37.5k, Selling: $90k
        // Buy: $150k - $90k - $37.5k = $22.5k
        expect(year0.buyNetWorth).toBeCloseTo(22500, -2);

        // Rent: $150k + $37.5k = $187.5k
        expect(year0.rentNetWorth).toBeCloseTo(187500, -2);
    });

    it('renter starts ahead due to lower down payment', () => {
        const data = calculateNetWorth(inputs, 8);
        expect(data[0].rentNetWorth).toBeGreaterThan(data[0].buyNetWorth);
    });

    it('logs full trajectory for debugging', () => {
        const data = calculateNetWorth(inputs, 8);

        console.log('\nYear | Buy NW | Rent NW | Home Value | Mortgage | Ownership Cost | Rent');
        console.log('-----|--------|---------|------------|----------|----------------|------');
        data.forEach(d => {
            console.log(
                `${d.year.toString().padStart(4)} | ` +
                `${(d.buyNetWorth / 1000).toFixed(0).padStart(6)}k | ` +
                `${(d.rentNetWorth / 1000).toFixed(0).padStart(7)}k | ` +
                `${(d.homeValue / 1000).toFixed(0).padStart(10)}k | ` +
                `${(d.mortgageBalance / 1000).toFixed(0).padStart(8)}k | ` +
                `${(d.annualOwnershipCost / 1000).toFixed(1).padStart(14)}k | ` +
                `${(d.annualRent / 1000).toFixed(1).padStart(5)}k`
            );
        });
    });
});

describe('findCrossoverYear', () => {
    it('returns null when buy never beats rent', () => {
        const data = [
            { year: 0, buyNetWorth: 100, rentNetWorth: 200 },
            { year: 1, buyNetWorth: 150, rentNetWorth: 250 },
            { year: 2, buyNetWorth: 200, rentNetWorth: 300 },
        ] as any;

        expect(findCrossoverYear(data)).toBeNull();
    });

    it('finds crossover when buy eventually beats rent', () => {
        const data = [
            { year: 0, buyNetWorth: 100, rentNetWorth: 200 },
            { year: 1, buyNetWorth: 180, rentNetWorth: 220 },
            { year: 2, buyNetWorth: 260, rentNetWorth: 240 },
        ] as any;

        const crossover = findCrossoverYear(data);
        expect(crossover).not.toBeNull();
        expect(crossover).toBeGreaterThan(1);
        expect(crossover).toBeLessThan(2);
    });
});
