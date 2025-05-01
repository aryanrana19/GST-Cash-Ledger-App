// Chart.js Visualization for Expense Tracker

// Storage key should match your expense tracker app
const storageKey = "business_transactions";
const gstRates = {
    'Electronics & IT Equipment': 18,
    'Office Supplies': 12,
    'Food & Beverages': 5,
    'Professional Services': 18,
    'Rent & Utilities': 18,
    'Travel & Transportation': 5,
    'Marketing & Advertising': 18,
    'Non-Taxable': 0
};

// Chart objects - declare globally so we can update them
let incomeVsExpenseChart;
let categoryChart;
let balanceTrendChart;
let gstByCategoryChart;

// Color palettes for consistent styling
const colors = {
    income: 'rgba(46, 204, 113, 0.7)',
    expense: 'rgba(231, 76, 60, 0.7)',
    balance: 'rgba(52, 152, 219, 0.7)',
    gst: 'rgba(155, 89, 182, 0.7)',
    categories: [
        'rgba(241, 196, 15, 0.7)',
        'rgba(52, 152, 219, 0.7)',
        'rgba(46, 204, 113, 0.7)',
        'rgba(155, 89, 182, 0.7)',
        'rgba(231, 76, 60, 0.7)',
        'rgba(243, 156, 18, 0.7)',
        'rgba(26, 188, 156, 0.7)',
        'rgba(41, 128, 185, 0.7)'
    ]
};

// Load transactions from localStorage
function getTransactions() {
    const savedTransactions = localStorage.getItem(storageKey);
    return savedTransactions ? JSON.parse(savedTransactions) : [];
}

// Filter transactions based on time period
function filterTransactionsByTime(transactions, period) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let startDate;
    
    switch (period) {
        case 'month':
            startDate = new Date(currentYear, currentMonth, 1);
            break;
        case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case 'year':
            startDate = new Date(currentYear, 0, 1);
            break;
        case 'all':
        default:
            return transactions; // Return all transactions
    }
    
    return transactions.filter(t => new Date(t.datetime) >= startDate);
}

// Update summary boxes with filtered transaction data
function updateSummary(transactions) {
    
    const income = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = income - expense;
    
    // Calculate GST
    const gst = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
            const categoryRate = gstRates[t.category] || 0;
            const gstAmount = Math.abs(t.amount) * (categoryRate / 100);
            return sum + gstAmount;
        }, 0);
    
    // Update the summary boxes
    document.getElementById('summary-balance').textContent = `₹${balance.toFixed(2)}`;
    document.getElementById('summary-income').textContent = `₹${income.toFixed(2)}`;
    document.getElementById('summary-expense').textContent = `₹${expense.toFixed(2)}`;
    document.getElementById('summary-gst').textContent = `₹${gst.toFixed(2)}`;
}

// Group transactions by month for time-based charts
function groupTransactionsByMonth(transactions) {
    const grouped = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.datetime);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!grouped[monthYear]) {
            grouped[monthYear] = {
                income: 0,
                expense: 0,
                balance: 0
            };
        }
        
        if (transaction.amount > 0) {
            grouped[monthYear].income += transaction.amount;
        } else {
            grouped[monthYear].expense += Math.abs(transaction.amount);
        }
        
        grouped[monthYear].balance += transaction.amount;
    });
    
    // Convert to arrays for Chart.js
    const labels = Object.keys(grouped).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
    });
    
    const incomeData = labels.map(month => grouped[month].income);
    const expenseData = labels.map(month => grouped[month].expense);
    const balanceData = labels.map(month => grouped[month].balance);
    
    return { labels, incomeData, expenseData, balanceData };
}

// Group expenses by category
function groupExpensesByCategory(transactions) {
    const expensesByCategory = {};
    const gstByCategory = {};
    
    transactions
        .filter(t => t.amount < 0)
        .forEach(transaction => {
            const category = transaction.category || 'Uncategorized';
            const amount = Math.abs(transaction.amount);
            
            if (!expensesByCategory[category]) {
                expensesByCategory[category] = 0;
            }
            expensesByCategory[category] += amount;
            
            if (!gstByCategory[category]) {
                gstByCategory[category] = 0;
            }
            const categoryRate = gstRates[category] || 0;
            const gstAmount = amount * (categoryRate / 100);
            gstByCategory[category] += gstAmount;
        });
    
    const sortedCategories = Object.keys(expensesByCategory).sort(
        (a, b) => expensesByCategory[b] - expensesByCategory[a]
    );
    
    const categoryAmounts = sortedCategories.map(cat => expensesByCategory[cat]);
    const gstAmounts = sortedCategories.map(cat => gstByCategory[cat]);
    
    return { 
        categories: sortedCategories, 
        amounts: categoryAmounts,
        gstAmounts: gstAmounts
    };
}

// Create Income vs Expense Chart
function createIncomeVsExpenseChart(labels, incomeData, expenseData) {
    const ctx = document.getElementById('incomeVsExpenseChart').getContext('2d');
    
    if (incomeVsExpenseChart) {
        incomeVsExpenseChart.destroy();
    }
    
    incomeVsExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: colors.income,
                    borderColor: colors.income,
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: colors.expense,
                    borderColor: colors.expense,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ₹${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Create Category Breakdown Chart (Doughnut/Pie)
function createCategoryChart(categories, amounts) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }

    const backgroundColors = categories.map((_, index) => 
        colors.categories[index % colors.categories.length]
    );
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Create Balance Trend Chart
function createBalanceTrendChart(labels, balanceData) {
    const ctx = document.getElementById('balanceTrendChart').getContext('2d');
    
    if (balanceTrendChart) {
        balanceTrendChart.destroy();
    }
    
    balanceTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Balance',
                data: balanceData,
                backgroundColor: colors.balance,
                borderColor: colors.balance,
                borderWidth: 2,
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Balance: ₹${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Create GST by Category Chart
function createGSTByCategoryChart(categories, gstAmounts) {
    const ctx = document.getElementById('gstByCategory').getContext('2d');
    
    if (gstByCategoryChart) {
        gstByCategoryChart.destroy();
    }
    
    const backgroundColors = categories.map((_, index) => 
        colors.categories[index % colors.categories.length]
    );
    
    gstByCategoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'GST Amount',
                data: gstAmounts,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'GST Amount (₹)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `GST: ₹${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Main function to update all charts and summary
function updateDashboard(timePeriod) {
    let transactions = getTransactions();
    
    transactions = filterTransactionsByTime(transactions, timePeriod);
    
    updateSummary(transactions);
    
    if (transactions.length === 0) {
        const noDataMessage = {
            id: 'noDataMessage',
            beforeDraw: (chart) => {
                const { ctx, width, height } = chart;
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '16px Arial';
                ctx.fillStyle = '#7f8c8d';
                ctx.fillText('No transaction data available', width / 2, height / 2);
                ctx.restore();
            }
        };
        
        // Create empty charts with the no data message
        createIncomeVsExpenseChart([], [], []);
        createCategoryChart([], []);
        createBalanceTrendChart([], []);
        createGSTByCategoryChart([], []);
        return;
    }
    
    const { labels, incomeData, expenseData, balanceData } = groupTransactionsByMonth(transactions);
    
    const { categories, amounts, gstAmounts } = groupExpensesByCategory(transactions);
    
    createIncomeVsExpenseChart(labels, incomeData, expenseData);
    createCategoryChart(categories, amounts);
    createBalanceTrendChart(labels, balanceData);
    createGSTByCategoryChart(categories, gstAmounts);
}

document.addEventListener('DOMContentLoaded', function() {
    updateDashboard('all');
    
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            this.classList.add('active');
            
            updateDashboard(this.dataset.period);
        });
    });
});