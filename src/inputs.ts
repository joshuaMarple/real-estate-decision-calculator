// Input handling and validation

import { CalculatorInputs, DEFAULT_INPUTS } from './calculator.js';

export interface InputElements {
    purchasePrice: HTMLInputElement;
    downPaymentPercent: HTMLInputElement;
    mortgageRate: HTMLInputElement;
    monthlyRent: HTMLInputElement;
    homeAppreciationRate: HTMLInputElement;
    rentGrowthRate: HTMLInputElement;
    yearsSlider: HTMLInputElement;
    yearsValue: HTMLElement;
}

// Get all input elements from the DOM
export function getInputElements(): InputElements {
    return {
        purchasePrice: document.getElementById('purchase-price') as HTMLInputElement,
        downPaymentPercent: document.getElementById('down-payment') as HTMLInputElement,
        mortgageRate: document.getElementById('mortgage-rate') as HTMLInputElement,
        monthlyRent: document.getElementById('monthly-rent') as HTMLInputElement,
        homeAppreciationRate: document.getElementById('home-appreciation') as HTMLInputElement,
        rentGrowthRate: document.getElementById('rent-growth') as HTMLInputElement,
        yearsSlider: document.getElementById('years-slider') as HTMLInputElement,
        yearsValue: document.getElementById('years-value') as HTMLElement,
    };
}

// Parse a numeric input, handling commas and currency symbols
function parseNumericInput(value: string): number {
    // Remove currency symbols, commas, and spaces
    const cleaned = value.replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// Read current values from input elements
export function readInputs(elements: InputElements): CalculatorInputs {
    return {
        purchasePrice: parseNumericInput(elements.purchasePrice.value),
        downPaymentPercent: parseNumericInput(elements.downPaymentPercent.value),
        mortgageRate: parseNumericInput(elements.mortgageRate.value) / 100, // Convert % to decimal
        monthlyRent: parseNumericInput(elements.monthlyRent.value),
        homeAppreciationRate: parseNumericInput(elements.homeAppreciationRate.value) / 100,
        rentGrowthRate: parseNumericInput(elements.rentGrowthRate.value) / 100,
        // Defaults from calculator.ts
        investmentReturnRate: DEFAULT_INPUTS.investmentReturnRate!,
        propertyTaxRate: DEFAULT_INPUTS.propertyTaxRate!,
        hoaMonthly: DEFAULT_INPUTS.hoaMonthly!,
        maintenanceRate: DEFAULT_INPUTS.maintenanceRate!,
        closingCostRate: DEFAULT_INPUTS.closingCostRate!,
        sellingCostRate: DEFAULT_INPUTS.sellingCostRate!,
        insuranceAnnual: DEFAULT_INPUTS.insuranceAnnual!,
    };
}

// Get the years value from the slider
export function readYears(elements: InputElements): number {
    return parseInt(elements.yearsSlider.value, 10);
}

// Format number as currency for display
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

// Format number with commas for input display
export function formatNumberWithCommas(value: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

// Validate inputs and return any error messages
export function validateInputs(inputs: CalculatorInputs): string[] {
    const errors: string[] = [];

    if (inputs.purchasePrice <= 0) {
        errors.push('Purchase price must be greater than 0');
    }
    if (inputs.downPaymentPercent < 0 || inputs.downPaymentPercent > 100) {
        errors.push('Down payment must be between 0% and 100%');
    }
    if (inputs.mortgageRate < 0 || inputs.mortgageRate > 0.25) {
        errors.push('Mortgage rate seems unrealistic (should be between 0% and 25%)');
    }
    if (inputs.monthlyRent < 0) {
        errors.push('Monthly rent cannot be negative');
    }
    if (inputs.homeAppreciationRate < -0.2 || inputs.homeAppreciationRate > 0.3) {
        errors.push('Home appreciation rate seems unrealistic (-20% to 30%)');
    }
    if (inputs.rentGrowthRate < -0.1 || inputs.rentGrowthRate > 0.2) {
        errors.push('Rent growth rate seems unrealistic (-10% to 20%)');
    }

    return errors;
}

// Setup input formatting (add commas as user types for price fields)
export function setupInputFormatting(elements: InputElements): void {
    const priceInputs = [elements.purchasePrice, elements.monthlyRent];

    priceInputs.forEach((input) => {
        input.addEventListener('blur', () => {
            const value = parseNumericInput(input.value);
            if (value > 0) {
                input.value = formatNumberWithCommas(value);
            }
        });

        input.addEventListener('focus', () => {
            const value = parseNumericInput(input.value);
            if (value > 0) {
                input.value = value.toString();
            }
        });
    });
}
