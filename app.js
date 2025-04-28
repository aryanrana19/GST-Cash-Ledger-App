// DOM ELEMENTS
const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const list = document.getElementById("list");
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById("amount");
const datetime = document.getElementById("datetime");
const category = document.getElementById("category");
const gstDisplay = document.getElementById("gst-display");
const exportBtn = document.getElementById('exportBtn');
const storageKey = "business_transactions";

// DUMMY TRANSACTIONS
const dummyTransactions = [];

// Initialize transactions with dummy data
let transactions = [...dummyTransactions];

// GST RATES BY CATEGORY
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

// ADD TRANSACTIONS TO THE DOM
function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement("li");
    
    // Format date for display
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
            <span class="transaction-category">${transaction.category || 'N/A'}</span>
        </div>
        <span class="transaction-text">${transaction.text}</span>
        <span class="transaction-amount">${sign}₹${Math.abs(transaction.amount)}</span>
        <button class="delete-btn" onClick="removeTransaction(${transaction.id})">X</button>
    `;
    list.appendChild(item);
}

// Set default datetime on load
window.onload = function() {
    const now = new Date();
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const formattedNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 16);
    datetime.value = formattedNow;
    loadTransaction();
};

// CALCULATE GST BASED ON CATEGORIES
function calculateGST() {
    let totalGST = 0;
    
    transactions.filter(t => t.type === 'expense').forEach(transaction => {
        const categoryRate = gstRates[transaction.category] || 0;
        const expenseAmount = Math.abs(transaction.amount);
        const gstAmount = expenseAmount * (categoryRate / 100);
        totalGST += gstAmount;
    });
    
    return totalGST;
}

// DISPLAY BALANCE, INCOME, EXPENSES AND GST
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);
  
    // TOTAL BALANCE (income - expenses)
    const total = amounts.reduce((sum, amount) => sum + amount, 0).toFixed(2);
    
    // TOTAL INCOME (positive amounts)
    const income = amounts
      .filter(amount => amount > 0)
      .reduce((sum, amount) => sum + amount, 0)
      .toFixed(2);
    
    // TOTAL EXPENSES (negative amounts, converted to positive)
    const expense = (amounts
      .filter(amount => amount < 0)
      .reduce((sum, amount) => sum + amount, 0) * -1)
      .toFixed(2);
  
    // Update the DOM
    balance.innerText = `₹${total}`;
    money_plus.innerText = `+₹${income}`;
    money_minus.innerText = `-₹${expense}`;
    
    // Calculate and display GST
    const gstOwed = calculateGST();
    gstDisplay.textContent = `₹${gstOwed.toFixed(2)}`;
}

// ADD TRANSACTION (INCOME OR EXPENSE)
function addTransaction(e, type) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '' || category.value === '') {
        alert("Please fill all fields");
    } else {
        const transaction = {
            id: generateID(),
            text: text.value,
            amount: type === 'income' ? +amount.value : -amount.value,
            datetime: datetime.value,
            category: category.value,
            type: type // 'income' or 'expense'
        };
        transactions.push(transaction);
        localStorage.setItem(storageKey, JSON.stringify(transactions));
        addTransactionDOM(transaction);
        updateValues();

        // Clear form
        text.value = '';
        amount.value = '';
        // Set datetime to current time again
        const now = new Date();
        const formattedNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 16);
        datetime.value = formattedNow;
    }
}

// LOAD TRANSACTIONS FROM LOCAL STORAGE
function loadTransaction() {
    const savedTransactions = localStorage.getItem(storageKey);
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
        init();
    }
}

// GENERATE ID FUNCTION
function generateID() {
    return Math.floor(Math.random() * 1000000);
}

// REMOVE TRANSACTION FUNCTION
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(transactions));
    init();
}

// EXPORT TO CSV FUNCTION
function exportToCSV() {
    if (transactions.length === 0) {
        alert("No transactions to export!");
        return;
    }

    // Prepare CSV headers
    let csv = 'ID,Description,Amount,Date,Category,Type,GST Amount\n';
    
    // Add transaction data
    transactions.forEach(t => {
        let gstAmount = 0;
        if (t.type === 'expense') {
            const categoryRate = gstRates[t.category] || 0;
            gstAmount = Math.abs(t.amount) * (categoryRate / 100);
        }
        
        csv += `${t.id},"${t.text}",${t.amount},"${new Date(t.datetime).toLocaleString()}","${t.category}","${t.type}",${gstAmount.toFixed(2)}\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// INIT FUNCTION
function init() {
    list.innerHTML = ''; // Clear the list before rendering

    // Loop through all transactions and add them to the DOM
    transactions.forEach(addTransactionDOM);
    updateValues(); // Update balance, income, expense and GST
}

// EVENT LISTENERS
document.querySelector('.btn-inc').addEventListener('click', function (e) {
    addTransaction(e, 'income'); // Pass 'income' to add positive amount
});

document.querySelector('.btn-exp').addEventListener('click', function (e) {
    addTransaction(e, 'expense'); // Pass 'expense' to add negative amount
});

exportBtn.addEventListener('click', exportToCSV);

// Initialize the app
init();



// ========================================================================================================================================
// DATA VISUALIZATION 

