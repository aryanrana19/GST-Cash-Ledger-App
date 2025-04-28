// Render charts when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const transactions = getTransactions(); // From script.js
    renderExpenseChart(transactions);
  });
  
  function renderExpenseChart(transactions) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    // Group expenses by category (same logic as before)
    const categories = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const cat = t.category || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + Math.abs(t.amount);
      }
    });
  
    // Create the chart
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(categories),
        datasets: [{
          label: 'Expenses by Category',
          data: Object.values(categories),
          backgroundColor: '#36A2EB',
          borderWidth: 1
        }]
      },
      options: { responsive: true }
    });
  }