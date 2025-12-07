// Main entry point - Chart visualization and app initialization

import { calculateNetWorth, findCrossoverYear, YearlyData } from './calculator.js';
import { getInputElements, readInputs, readYears, setupInputFormatting, formatCurrency } from './inputs.js';
import { readFromURL, writeToURL, applyURLState } from './url.js';

declare const Chart: any;

const canvas = document.getElementById('chart') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const crossoverInfo = document.getElementById('crossover-info') as HTMLDivElement;

// Get input elements
const elements = getInputElements();

// Initialize chart
let chart: any;

function initChart(data: YearlyData[]) {
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.year === 0 ? 'Now' : `Year ${d.year}`),
            datasets: [
                {
                    label: 'Buy',
                    data: data.map(d => d.buyNetWorth),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.1,
                    fill: false,
                },
                {
                    label: 'Rent',
                    data: data.map(d => d.rentNetWorth),
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.1,
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context: any) {
                            const label = context.dataset.label || '';
                            const value = formatCurrency(context.parsed.y);
                            return `${label}: ${value}`;
                        },
                        afterBody: function (tooltipItems: any[]) {
                            const index = tooltipItems[0].dataIndex;
                            const yearData = data[index];
                            if (!yearData || yearData.year === 0) return '';

                            return [
                                '',
                                `Home Value: ${formatCurrency(yearData.homeValue)}`,
                                `Home Equity: ${formatCurrency(yearData.homeEquity)}`,
                                `Mortgage Balance: ${formatCurrency(yearData.mortgageBalance)}`,
                                `Annual Ownership Cost: ${formatCurrency(yearData.annualOwnershipCost)}`,
                                `Annual Rent: ${formatCurrency(yearData.annualRent)}`,
                            ];
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function (value: number) {
                            return formatCurrency(value);
                        },
                    },
                },
            },
        },
    });
}

function updateChart() {
    const inputs = readInputs(elements);
    const years = readYears(elements);

    const data = calculateNetWorth(inputs, years);

    // Update chart data
    chart.data.labels = data.map(d => d.year === 0 ? 'Now' : `Year ${d.year}`);
    chart.data.datasets[0].data = data.map(d => d.buyNetWorth);
    chart.data.datasets[1].data = data.map(d => d.rentNetWorth);

    // Update tooltip data reference
    chart.options.plugins.tooltip.callbacks.afterBody = function (tooltipItems: any[]) {
        const index = tooltipItems[0].dataIndex;
        const yearData = data[index];
        if (!yearData || yearData.year === 0) return '';

        return [
            '',
            `Home Value: ${formatCurrency(yearData.homeValue)}`,
            `Home Equity: ${formatCurrency(yearData.homeEquity)}`,
            `Mortgage Balance: ${formatCurrency(yearData.mortgageBalance)}`,
            `Annual Ownership Cost: ${formatCurrency(yearData.annualOwnershipCost)}`,
            `Annual Rent: ${formatCurrency(yearData.annualRent)}`,
        ];
    };

    chart.update();

    // Update crossover info
    const crossover = findCrossoverYear(data);
    if (crossover !== null) {
        crossoverInfo.textContent = `Buying becomes better than renting at year ${crossover.toFixed(1)}`;
        crossoverInfo.className = 'crossover-info visible';
    } else {
        const finalBuy = data[data.length - 1].buyNetWorth;
        const finalRent = data[data.length - 1].rentNetWorth;
        if (finalBuy > finalRent) {
            crossoverInfo.textContent = `Buying is better from the start`;
        } else {
            crossoverInfo.textContent = `Renting remains better through year ${years}`;
        }
        crossoverInfo.className = 'crossover-info visible';
    }

    // Update URL
    writeToURL(elements, years);
}

// Debounce function for input changes
function debounce(fn: () => void, delay: number) {
    let timeoutId: number;
    return () => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(fn, delay);
    };
}

const debouncedUpdate = debounce(updateChart, 150);

// Setup event listeners
function setupEventListeners() {
    // All input fields
    const inputIds = [
        'purchase-price',
        'down-payment',
        'mortgage-rate',
        'monthly-rent',
        'home-appreciation',
        'rent-growth',
    ];

    inputIds.forEach(id => {
        const input = document.getElementById(id) as HTMLInputElement;
        input.addEventListener('input', debouncedUpdate);
    });

    // Years slider (immediate update)
    elements.yearsSlider.addEventListener('input', () => {
        elements.yearsValue.textContent = elements.yearsSlider.value;
        updateChart();
    });
}

// Initialize app
function init() {
    // Apply URL state if present
    const urlState = readFromURL();
    applyURLState(elements, urlState);

    // Setup input formatting (commas for price fields)
    setupInputFormatting(elements);

    // Calculate initial data
    const inputs = readInputs(elements);
    const years = readYears(elements);
    const data = calculateNetWorth(inputs, years);

    // Initialize chart
    initChart(data);

    // Setup event listeners
    setupEventListeners();

    // Initial crossover calculation
    updateChart();
}

// Run when DOM is ready
init();
