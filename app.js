// DOM ELEMENTS
const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const list = document.getElementById("list");
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById("amount");
const datetime = document.getElementById("datetime");
const storageKey = "business_transactions";


// DUMMY TRANSACTIONS
const dummyTransactions = [
    
];

// Initialize transactions with dummy data
let transactions = [...dummyTransactions];

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
};

// DISPLAY BALANCE AND VALUES
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => acc += item, 0).toFixed(2);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0).toFixed(2);
    const expense = (amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) * -1).toFixed(2);

    balance.innerText = `₹${total}`;
    money_plus.innerText = `₹${income}`;
    money_minus.innerText = `₹${expense}`;
}

// ADD TRANSACTION (INCOME OR EXPENSE)
function addTransaction(e, type) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '' || category.value === '') {
        alert("Please fill all fields");
    }else{
        const transaction = {
            id: generateID(),
            text: text.value,
            amount: type === 'income' ? +amount.value : -amount.value,
            datetime: datetime.value,
            category: category.value,
            type: type // 'income' or 'expense'
        };
        transactions.push(transaction);
        localStorage.setItem(storageKey, JSON.stringify(transactions))
        addTransactionDOM(transaction);
        updateValues();

        // Clear form
        text.value = '';
        amount.value = '';
        datetime.value = '';
    }
}

// LOAD FUNCTION
function loadTransaction(){
    const savedTransactions = localStorage.getItem(storageKey)
    if(savedTransactions){
        transactions = JSON.parse(savedTransactions)
        init()
    }
}

// GENERATE ID FUNCTION
function generateID() {
    return Math.floor(Math.random() * 1000000);
}

// REMOVE TRANSACTION FUNCTION
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id); // Remove transaction by ID
    init(); // Reinitialize the page after deletion
}

// INIT FUNCTION
function init() {
    list.innerHTML = ''; // Clear the list before rendering

    // Loop through all transactions and add them to the DOM
    transactions.forEach(addTransactionDOM);
    updateValues(); // Update balance, income, and expense
}

// Initialize the app with dummy transactions
init();

// EVENT LISTENERS FOR ADD INCOME AND ADD EXPENSE BUTTONS
document.querySelector('.btn-inc').addEventListener('click', function (e) {
    addTransaction(e, 'income'); // Pass 'income' to add positive amount
});

document.querySelector('.btn-exp').addEventListener('click', function (e) {
    addTransaction(e, 'expense'); // Pass 'expense' to add negative amount
});


// EXPORT BUTTON

// Add to your DOM elements
const exportBtn = document.getElementById('exportBtn');

// Export to CSV function
function exportToCSV() {
    if (transactions.length === 0) {
        alert("No transactions to export!");
        return;
    }

    // Prepare CSV headers
    let csv = 'ID,Description,Amount,Date,Category,Type\n';
    
    // Add transaction data
    transactions.forEach(t => {
        csv += `${t.id},"${t.text}",${t.amount},"${new Date(t.datetime).toLocaleString()}","${t.category}","${t.type}"\n`;
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

// Event listener
exportBtn.addEventListener('click', exportToCSV);


// GST CALCULATIONS

const gstRates = {
    'Electronics': 18,  // Laptop (18% GST)
    'Utilities':     5,  // Electricity (5% GST)
    'Office Supplies': 12,
    'Non-Taxable':    0   // e.g., Salaries
  };

function calculateGST() {
    const taxableExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return taxableExpenses * 0.18; // 18% GST
  }
  
  // Add to your updateValues() function
  function updateValues() {
    // ... (your existing code) ...
    const amounts = transactions.map(t => t.amount);
  
  // TOTAL BALANCE (income - expenses)
  const total = amounts.reduce((sum, amount) => sum + amount, 0).toFixed(2);
  
  // TOTAL INCOME (positive amounts)
  const income = amounts
    .filter(amount => amount > 0)
    .reduce((sum, amount) => sum + amount, 0)
    .toFixed(2);
  
  // TOTAL EXPENSES (negative amounts, converted to positive)
  const expense = amounts
    .filter(amount => amount < 0)
    .reduce((sum, amount) => sum + amount, 0) * -1
    .toFixed(2);

  // Update the DOM
  balance.innerText = `₹${total}`;
  money_plus.innerText = `+₹${income}`;
  money_minus.innerText = `-₹${expense}`;
    // Add GST display
    const gstOwed = calculateGST();
    document.getElementById('gst-display').textContent = `₹${gstOwed.toFixed(2)}`;
  }



loadTransaction()