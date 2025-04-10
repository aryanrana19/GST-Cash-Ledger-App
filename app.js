// DOM ELEMENTS
const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const list = document.getElementById("list");
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById("amount");
const datetime = document.getElementById("datetime");
const category = document.getElementById('category'); // Added missing element
const exportBtn = document.getElementById('exportBtn');
const gstDisplay = document.getElementById('gst-display'); // Added missing element
const storageKey = "business_transactions";

// GST RATES BY CATEGORY
const gstRates = {
    'Electronics': 18,  // 18% GST
    'Utilities': 5,     // 5% GST
    'Office Supplies': 12, // 12% GST
    'Non-Taxable': 0    // 0% GST
};

// Initialize transactions
let transactions = JSON.parse(localStorage.getItem(storageKey)) || [];

// INITIALIZE APP
function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
    setDefaultDateTime();
}

// SET DEFAULT DATETIME
function setDefaultDateTime() {
    const now = new Date();
    datetime.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                   .toISOString()
                   .slice(0, 16);
}

// ADD TRANSACTION TO DOM
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
        <span class="transaction-category"></span>
        <span class="transaction-amount">${sign}₹${Math.abs(transaction.amount)}</span>
        <button class="delete-btn" onClick="removeTransaction(${transaction.id})">X</button>
    `;
    list.appendChild(item);
}

// ADD NEW TRANSACTION
function addTransaction(e, type) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '' || category.value === '') {
        alert("Please fill all fields");
        return;
    }

    const transaction = {
        id: generateID(),
        text: text.value,
        amount: type === 'income' ? +amount.value : -amount.value,
        datetime: datetime.value,
        category: category.value,
        type: type
    };

    transactions.push(transaction);
    saveTransactions();
    addTransactionDOM(transaction);
    updateValues();
    resetForm();
}

// UPDATE ALL CALCULATIONS
function updateValues() {
    const amounts = transactions.map(t => t.amount);
    
    // Balance, Income, Expense
    const total = amounts.reduce((sum, amt) => sum + amt, 0).toFixed(2);
    const income = amounts.filter(amt => amt > 0).reduce((sum, amt) => sum + amt, 0).toFixed(2);
    const expense = Math.abs(amounts.filter(amt => amt < 0).reduce((sum, amt) => sum + amt, 0)).toFixed(2);

    balance.innerText = `₹${total}`;
    money_plus.innerText = `+₹${income}`;
    money_minus.innerText = `-₹${expense}`;
    
    // GST Calculation
    const gstOwed = calculateGST();
    gstDisplay.textContent = `₹${gstOwed.toFixed(2)}`;
}

// CALCULATE GST BY CATEGORY
function calculateGST() {
    return transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
            const rate = (gstRates[t.category] || 0) / 100;
            return sum + (Math.abs(t.amount) * rate);
        }, 0);
}

// REMOVE TRANSACTION
function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    init();
}

// SAVE TO LOCAL STORAGE
function saveTransactions() {
    localStorage.setItem(storageKey, JSON.stringify(transactions));
}

// EXPORT TO CSV
function exportToCSV() {
    if (transactions.length === 0) {
        alert("No transactions to export!");
        return;
    }

    let csv = 'ID,Description,Amount,Date,Category,Type,GST Rate\n';
    transactions.forEach(t => {
        const rate = t.type === 'expense' ? gstRates[t.category] || 0 : 0;
        csv += `${t.id},"${t.text}",${t.amount},"${new Date(t.datetime).toLocaleString()}","${t.category}","${t.type}","${rate}%"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
}

// HELPER FUNCTIONS
function generateID() {
    return Math.floor(Math.random() * 1000000);
}

function resetForm() {
    text.value = '';
    amount.value = '';
    setDefaultDateTime();
}

// EVENT LISTENERS
document.querySelector('.btn-inc').addEventListener('click', (e) => addTransaction(e, 'income'));
document.querySelector('.btn-exp').addEventListener('click', (e) => addTransaction(e, 'expense'));
exportBtn.addEventListener('click', exportToCSV);

// INITIALIZE APP
init();