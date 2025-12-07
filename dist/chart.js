"use strict";
// Chart setup with dummy data
// Chart.js is loaded via CDN in index.html
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('years-slider');
const yearsValue = document.getElementById('years-value');
function generateData(years) {
    const labels = [];
    const buyData = [];
    const rentData = [];
    for (let i = 0; i <= years; i++) {
        labels.push(`Year ${i}`);
        // Dummy linear growth - will be replaced with real calculations
        buyData.push(100000 + i * 50000);
        rentData.push(100000 + i * 40000);
    }
    return { labels, buyData, rentData };
}
// Initialize chart
const data = generateData(10);
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: data.labels,
        datasets: [
            {
                label: 'Buy',
                data: data.buyData,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.1
            },
            {
                label: 'Rent',
                data: data.rentData,
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                tension: 0.1
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                ticks: {
                    callback: function (value) {
                        return '$' + value.toLocaleString();
                    }
                }
            }
        }
    }
});
// Update chart when slider changes
slider.addEventListener('input', function () {
    const years = parseInt(slider.value);
    yearsValue.textContent = years.toString();
    const newData = generateData(years);
    chart.data.labels = newData.labels;
    chart.data.datasets[0].data = newData.buyData;
    chart.data.datasets[1].data = newData.rentData;
    chart.update();
});
//# sourceMappingURL=chart.js.map