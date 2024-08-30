// Helpers
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
// End helpers

let netWorthChart;
let earningsChart;

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', calculateResults);
    input.addEventListener('input', calculateResults);
});

calculateResults();

function calculateResults() {
    const duration = parseInt($('#duration').value);
    const homePrice = parseFloat($('#homePrice').value);
    const depositPercent = parseFloat($('#deposit').value) / 100;
    const loanPeriod = parseInt($('#loanPeriod').value);
    const interestRate = parseFloat($('#interestRate').value) / 100;
    const closingCostsPercent = parseFloat($('#closingCosts').value) / 100;
    const insurancePercent = parseFloat($('#insurance').value) / 100;
    const maintenancePercent = parseFloat($('#maintenance').value) / 100;
    const ratesTaxesPercent = parseFloat($('#ratesTaxes').value) / 100;
    const leviesPercent = parseFloat($('#levies').value) / 100;
    const managementFeesPercent = parseFloat($('#managementFees').value) / 100;

    const propertyIncreasePercent = parseFloat($('#propertyIncrease').value) / 100;
    const rent = parseFloat($('#rent').value);
    const rentalIncreasePercent = parseFloat($('#rentalIncrease').value) / 100;
    const savingsInterestRate = parseFloat($('#savingsInterest').value) / 100;

    const deposit = homePrice * depositPercent;
    const loanAmount = homePrice - deposit;
    const closingCosts = homePrice * closingCostsPercent;

    const annualPayment = (loanAmount * interestRate) / (1 - Math.pow(1 + interestRate, -loanPeriod));

    let netWorth = 0;
    let amountSpent = deposit + closingCosts;
    let homeValue = homePrice;
    let remainingLoanBalance = loanAmount;
    const netWorthOverTime = [];
    const amountSpentOverTime = [];
    const owningEarningsOverTime = [];
    const rentingEarningsOverTime = [];

    netWorthOverTime.push({ year: 0, netWorth: 0 });
    amountSpentOverTime.push({ year: 0, annualCosts: 0 });
    owningEarningsOverTime.push({ year: 0, earnings: 0 });
    rentingEarningsOverTime.push({ year: 0, earnings: 0 });

    let rentalNetWorth = deposit + closingCosts;
    let annualRent = rent * 12;

    const rentalNetWorthOverTime = [];
    rentalNetWorthOverTime.push({ year: 0, netWorth: 0 });

    for (let year = 1; year <= duration; year++) {
        homeValue *= 1 + propertyIncreasePercent;

        const annualMortgagePayments = year <= loanPeriod ? annualPayment : 0;
        const annualInsurance = homeValue * insurancePercent;
        const annualMaintenance = homeValue * maintenancePercent;
        const annualRatesTaxes = homeValue * ratesTaxesPercent;
        const annualLevies = homeValue * leviesPercent;
        const annualManagementFees = homeValue * managementFeesPercent;
        const annualCosts = annualMortgagePayments + annualInsurance + annualMaintenance + annualRatesTaxes + annualLevies + annualManagementFees;

        if (year <= loanPeriod) {
            const interestPaid = remainingLoanBalance * interestRate;
            const principalPaid = annualMortgagePayments - interestPaid;
            remainingLoanBalance -= principalPaid;
        } else {
            remainingLoanBalance = 0;
        }

        const equity = homeValue - remainingLoanBalance;
        netWorth = equity - annualCosts - closingCosts;

        netWorthOverTime.push({ year: year, netWorth: netWorth });
        amountSpent += annualCosts;
        amountSpentOverTime.push({ year: year, annualCosts: amountSpent });

        rentalNetWorth *= 1 + savingsInterestRate;
        const annualSavings = annualCosts - annualRent;
        rentalNetWorth += annualSavings;

        annualRent *= 1 + rentalIncreasePercent;

        rentalNetWorthOverTime.push({ year: year, netWorth: rentalNetWorth });

        owningEarningsOverTime.push({ year: year, earnings: netWorth - amountSpent });
        rentingEarningsOverTime.push({ year: year, earnings: rentalNetWorth - amountSpent });
    }

    buildGraph(netWorthOverTime, rentalNetWorthOverTime, amountSpentOverTime);
    buildEarningsGraph(owningEarningsOverTime, rentingEarningsOverTime);
}

function buildGraph(owningData, rentingData, costsData = []) {
    const ctx = $('#netWorthChart').getContext('2d');
    if (netWorthChart) {
        netWorthChart.destroy();
    }
    netWorthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: owningData.map(data => data.year),
            datasets: [{
                label: 'Equity value when owning',
                data: owningData.map(data => data.netWorth),
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false
            }, {
                label: 'Equity value when renting',
                data: rentingData.map(data => data.netWorth),
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false
            }, {
                label: 'Amount spent',
                data: costsData.map(data => data.annualCosts),
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    });
}

function buildEarningsGraph(owningEarningsData, rentingEarningsData) {
    const ctx = $('#earningsChart').getContext('2d');
    if (earningsChart) {
        earningsChart.destroy();
    }
    earningsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: owningEarningsData.map(data => data.year),
            datasets: [{
                label: 'Earnings when owning',
                data: owningEarningsData.map(data => data.earnings),
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false
            }, {
                label: 'Earnings when renting',
                data: rentingEarningsData.map(data => data.earnings),
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Earnings'
                    }
                }
            }
        }
    });
}