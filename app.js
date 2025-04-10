// DOM Elements
const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const list = document.getElementById("list");
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById("amount");
const datetime = document.getElementById("datetime");
const category = document.getElementById('category');
const exportBtn = document.getElementById('exportBtn');
const gstDisplay = document.getElementById('gst-display');

// Storage
const storageKey = "business_transactions";
let transactions = JSON.parse(localStorage.getItem(storageKey)) || [];

// Initialize app
function init() {
    // Set default datetime
    const now = new Date();
    datetime.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    // Load existing transactions
    renderTransactions();
    updateCalculations();
}

// Add transaction to history
function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement("li");
    
    const transactionDate = new Date(transaction.datetime);
    const formattedDate = transactionDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    const formattedTime = transactionDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');
    item.innerHTML = `
        <div class="transaction-meta">
            <span class="transaction-date">${formattedDate}</span>
            <span class="transaction-time">${formattedTime}</span>
        </div>
        <span class="transaction-text">${transaction.text}</span>
        <span class="transaction-amount">${sign}₹${Math.abs(transaction.amount)}</span>
        <button class="delete-btn" onClick="removeTransaction(${transaction.id})">X</button>
    `;
    list.appendChild(item);
}

// Update all calculations
function updateCalculations() {
    // Calculate amounts
    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((sum, item) => sum + item, 0).toFixed(2);
    const income = amounts.filter(item => item > 0).reduce((sum, item) => sum + item, 0).toFixed(2);
    const expense = (amounts.filter(item => item < 0).reduce((sum, item) => sum + item, 0) * -1).toFixed(2);

    // Update UI
    balance.innerText = `₹${total}`;
    money_plus.innerText = `+₹${income}`;
    money_minus.innerText = `-₹${expense}`;
    
    // Calculate GST (simple version)
    const taxableExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const gstOwed = taxableExpenses * 0.18; // 18% GST
    gstDisplay.textContent = `₹${gstOwed.toFixed(2)}`;
}

// Add new transaction
function addTransaction(e, type) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '' || category.value === '') {
        alert("Please fill all fields");
        return;
    }

    const transaction = {
        id: Date.now(),
        text: text.value,
        amount: type === 'income' ? +amount.value : -amount.value,
        datetime: datetime.value,
        category: category.value,
        type: type
    };

    transactions.push(transaction);
    localStorage.setItem(storageKey, JSON.stringify(transactions));
    addTransactionDOM(transaction);
    updateCalculations();

    // Clear form
    text.value = '';
    amount.value = '';
    datetime.value = new Date().toISOString().slice(0, 16);
}

// Remove transaction
function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(transactions));
    renderTransactions();
    updateCalculations();
}

// Render all transactions
function renderTransactions() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
}

// Export to CSV
function exportToCSV() {
    if (transactions.length === 0) {
        alert("No transactions to export!");
        return;
    }

    let csv = 'ID,Description,Amount,Date,Category,Type\n';
    transactions.forEach(t => {
        csv += `${t.id},"${t.text}",${t.amount},"${new Date(t.datetime).toLocaleString()}","${t.category}","${t.type}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
}

// Event Listeners
document.querySelector('.btn-inc').addEventListener('click', (e) => addTransaction(e, 'income'));
document.querySelector('.btn-exp').addEventListener('click', (e) => addTransaction(e, 'expense'));
exportBtn.addEventListener('click', exportToCSV);

// Initialize app
init();