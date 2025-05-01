
class MLVisualizer {
    constructor() {
        this.charts = {
            cashFlow: null,
            gst: null,
            categories: null
        };
    }

    async init() {
        try {
            const transactions = this.getTransactionData();
            
            this.generateInsights(transactions);
            
            this.createCashFlowChart(transactions);
            this.createGSTChart(transactions);
            this.createCategoryChart(transactions);
            
        } catch (error) {
            console.error("ML Visualization error:", error);
        }
    }

    getTransactionData() {
        const savedTransactions = localStorage.getItem('business_transactions');
        if (!savedTransactions) {
            throw new Error("No transaction data found");
        }
        
        const transactions = JSON.parse(savedTransactions);
        
        return transactions.map(t => ({
            ...t,
            date: new Date(t.datetime),
            amount: parseFloat(t.amount),
            isExpense: t.amount < 0,
            isIncome: t.amount > 0
        }));
    }

    generateInsights(transactions) {
        const totalIncome = transactions
            .filter(t => t.isIncome)
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = transactions
            .filter(t => t.isExpense)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
        const gstLiability = transactions
            .filter(t => t.isExpense && t.category && t.category !== 'Non-Taxable')
            .reduce((sum, t) => {
                const rate = this.getGSTRate(t.category);
                return sum + (Math.abs(t.amount) * (rate / 100));
            }, 0);
            
        const categoryCounts = {};
        transactions
            .filter(t => t.isExpense && t.category)
            .forEach(t => {
                categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
            });
        const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        
        document.getElementById('insight1').textContent = 
            `Based on your current spending patterns, your estimated monthly GST liability is ₹${(gstLiability / 3).toFixed(2)}.`;
            
        document.getElementById('insight2').textContent = 
            `Your top expense category is ${topCategory}. Consider reviewing these expenses for potential savings.`;
            
        document.getElementById('insight3').textContent = 
            `Your current income-to-expense ratio is ${(totalIncome / totalExpenses).toFixed(2)}. ` +
            `A ratio above 1.5 is generally considered healthy for small businesses.`;
    }

    createCashFlowChart(transactions) {
        const ctx = document.getElementById('cashFlowChart').getContext('2d');
        
        const monthlyData = {};
        transactions.forEach(t => {
            const monthYear = `${t.date.getFullYear()}-${t.date.getMonth()}`;
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { income: 0, expenses: 0 };
            }
            
            if (t.isIncome) {
                monthlyData[monthYear].income += t.amount;
            } else {
                monthlyData[monthYear].expenses += Math.abs(t.amount);
            }
        });
        
        const sortedMonths = Object.keys(monthlyData).sort();
        const last3Months = sortedMonths.slice(-3);
        const forecastMonths = [
            ...last3Months,
            this.getNextMonth(last3Months[2]),
            this.getNextMonth(last3Months[2], 2),
            this.getNextMonth(last3Months[2], 3)
        ];
        
        // Create chart
        this.charts.cashFlow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: forecastMonths.map(m => this.formatMonthLabel(m)),
                datasets: [
                    {
                        label: 'Income',
                        data: forecastMonths.map((m, i) => {
                            if (i < last3Months.length) {
                                return monthlyData[m]?.income || 0;
                            }
                            const lastIncome = monthlyData[last3Months[last3Months.length - 1]]?.income || 0;
                            return lastIncome * (1 + (0.05 * (i - last3Months.length + 1)));
                        }),
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Expenses',
                        data: forecastMonths.map((m, i) => {
                            if (i < last3Months.length) {
                                return monthlyData[m]?.expenses || 0;
                            }
                            
                            const lastExpense = monthlyData[last3Months[last3Months.length - 1]]?.expenses || 0;
                            return lastExpense * (1 + (0.03 * (i - last3Months.length + 1)));
                        }),
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amount (₹)'
                        },
                        beginAtZero: true
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

    // Create GST forecast chart
    createGSTChart(transactions) {
        const ctx = document.getElementById('gstChart').getContext('2d');
        
        const monthlyGST = {};
        transactions.forEach(t => {
            if (t.isExpense && t.category && t.category !== 'Non-Taxable') {
                const monthYear = `${t.date.getFullYear()}-${t.date.getMonth()}`;
                const rate = this.getGSTRate(t.category);
                const gstAmount = Math.abs(t.amount) * (rate / 100);
                
                monthlyGST[monthYear] = (monthlyGST[monthYear] || 0) + gstAmount;
            }
        });
        
        const sortedMonths = Object.keys(monthlyGST).sort();
        const last3Months = sortedMonths.slice(-3);
        const forecastMonths = [
            ...last3Months,
            this.getNextMonth(last3Months[2]),
            this.getNextMonth(last3Months[2], 2),
            this.getNextMonth(last3Months[2], 3)
        ];
        
        // Create chart
        this.charts.gst = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: forecastMonths.map(m => this.formatMonthLabel(m)),
                datasets: [{
                    label: 'GST Liability',
                    data: forecastMonths.map((m, i) => {
                        // For historical data
                        if (i < last3Months.length) {
                            return monthlyGST[m] || 0;
                        }
                        // Forecast (simplified - replace with your ML prediction)
                        const lastGST = monthlyGST[last3Months[last3Months.length - 1]] || 0;
                        return lastGST * (1 + (0.04 * (i - last3Months.length + 1)));
                    }),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'GST Amount (₹)'
                        },
                        beginAtZero: true
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

    // Create expense category chart
    createCategoryChart(transactions) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        const categoryTotals = {};
        transactions
            .filter(t => t.isExpense && t.category)
            .forEach(t => {
                const amount = Math.abs(t.amount);
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
            });
        
        const categories = Object.keys(categoryTotals);
        const amounts = categories.map(c => categoryTotals[c]);
        
        this.charts.categories = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ₹${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    getGSTRate(category) {
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
        return gstRates[category] || 0;
    }

    formatMonthLabel(monthYear) {
        const [year, month] = monthYear.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(month)]} ${year}`;
    }

    getNextMonth(monthYear, monthsToAdd = 1) {
        const [year, month] = monthYear.split('-').map(Number);
        let newYear = year;
        let newMonth = month + monthsToAdd;
        
        while (newMonth > 11) {
            newMonth -= 12;
            newYear += 1;
        }
        
        return `${newYear}-${newMonth}`;
    }
}