// URL state management for sharing scenarios

import { InputElements } from './inputs.js';

// URL parameter keys (short for cleaner URLs)
const URL_KEYS = {
    purchasePrice: 'price',
    downPaymentPercent: 'down',
    mortgageRate: 'rate',
    monthlyRent: 'rent',
    homeAppreciationRate: 'appreciation',
    rentGrowthRate: 'rentgrowth',
    years: 'years',
} as const;

type URLKey = keyof typeof URL_KEYS;

interface URLState {
    purchasePrice?: number;
    downPaymentPercent?: number;
    mortgageRate?: number;
    monthlyRent?: number;
    homeAppreciationRate?: number;
    rentGrowthRate?: number;
    years?: number;
}

// Parse a number from string, returning undefined if invalid
function parseNumber(value: string | null): number | undefined {
    if (value === null) return undefined;
    const num = parseFloat(value.replace(/[$,\s]/g, ''));
    return isNaN(num) ? undefined : num;
}

// Read state from URL query parameters
export function readFromURL(): URLState {
    const params = new URLSearchParams(window.location.search);

    return {
        purchasePrice: parseNumber(params.get(URL_KEYS.purchasePrice)),
        downPaymentPercent: parseNumber(params.get(URL_KEYS.downPaymentPercent)),
        mortgageRate: parseNumber(params.get(URL_KEYS.mortgageRate)),
        monthlyRent: parseNumber(params.get(URL_KEYS.monthlyRent)),
        homeAppreciationRate: parseNumber(params.get(URL_KEYS.homeAppreciationRate)),
        rentGrowthRate: parseNumber(params.get(URL_KEYS.rentGrowthRate)),
        years: parseNumber(params.get(URL_KEYS.years)),
    };
}

// Build URL params from input elements
function buildParams(elements: InputElements, years: number): URLSearchParams {
    const params = new URLSearchParams();

    const values: Record<URLKey, number | undefined> = {
        purchasePrice: parseNumber(elements.purchasePrice.value),
        downPaymentPercent: parseNumber(elements.downPaymentPercent.value),
        mortgageRate: parseNumber(elements.mortgageRate.value),
        monthlyRent: parseNumber(elements.monthlyRent.value),
        homeAppreciationRate: parseNumber(elements.homeAppreciationRate.value),
        rentGrowthRate: parseNumber(elements.rentGrowthRate.value),
        years: years !== 10 ? years : undefined, // Only include if not default
    };

    for (const [key, value] of Object.entries(values)) {
        if (value !== undefined) {
            params.set(URL_KEYS[key as URLKey], value.toString());
        }
    }

    return params;
}

// Write current state to URL (without page reload)
export function writeToURL(elements: InputElements, years: number): void {
    const params = buildParams(elements, years);
    const newURL = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
    window.history.replaceState({}, '', newURL);
}

// Apply URL state to input elements
export function applyURLState(elements: InputElements, state: URLState): void {
    const mappings: Array<[keyof URLState, HTMLInputElement | HTMLElement]> = [
        ['purchasePrice', elements.purchasePrice],
        ['downPaymentPercent', elements.downPaymentPercent],
        ['mortgageRate', elements.mortgageRate],
        ['monthlyRent', elements.monthlyRent],
        ['homeAppreciationRate', elements.homeAppreciationRate],
        ['rentGrowthRate', elements.rentGrowthRate],
    ];

    for (const [key, element] of mappings) {
        const value = state[key];
        if (value !== undefined && element instanceof HTMLInputElement) {
            element.value = key === 'purchasePrice' || key === 'monthlyRent'
                ? value.toLocaleString()
                : value.toString();
        }
    }

    if (state.years !== undefined) {
        elements.yearsSlider.value = state.years.toString();
        elements.yearsValue.textContent = state.years.toString();
    }
}

// Generate shareable URL
export function getShareableURL(elements: InputElements, years: number): string {
    const params = buildParams(elements, years);
    const base = window.location.origin + window.location.pathname;
    return params.toString() ? `${base}?${params.toString()}` : base;
}
