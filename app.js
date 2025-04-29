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


// IMPORT FUNCTION

// Add these DOM element references at the top with your other DOM elements
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

// Add this function to handle CSV imports
function importFromCSV(csvText) {
    // Parse CSV (simple implementation - consider using a library like PapaParse for production)
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    // Find column indices
    const idIndex = headers.findIndex(h => h.trim().toLowerCase() === 'id');
    const descriptionIndex = headers.findIndex(h => h.trim().toLowerCase() === 'description');
    const amountIndex = headers.findIndex(h => h.trim().toLowerCase() === 'amount');
    const dateIndex = headers.findIndex(h => h.trim().toLowerCase() === 'date');
    const categoryIndex = headers.findIndex(h => h.trim().toLowerCase() === 'category');
    const typeIndex = headers.findIndex(h => h.trim().toLowerCase() === 'type');
    
    // Validate required columns
    if (descriptionIndex === -1 || amountIndex === -1) {
        alert('CSV must contain at least Description and Amount columns');
        return;
    }
    
    let importedCount = 0;
    const importedTransactions = [];
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        // Split by comma, but handle quoted values that might contain commas
        const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        if (values.length < 2) continue; // Skip malformed lines
        
        // Clean up quoted values
        const cleanValues = values.map(val => val.replace(/^"|"$/g, '').trim());
        
        // Create transaction object
        const transaction = {
            id: idIndex !== -1 && cleanValues[idIndex] ? Number(cleanValues[idIndex]) : generateID(),
            text: descriptionIndex !== -1 ? cleanValues[descriptionIndex] : 'Imported item',
            amount: amountIndex !== -1 ? Number(cleanValues[amountIndex]) : 0,
            datetime: dateIndex !== -1 && cleanValues[dateIndex] ? new Date(cleanValues[dateIndex]).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            category: categoryIndex !== -1 && cleanValues[categoryIndex] ? cleanValues[categoryIndex] : 'Non-Taxable',
            type: typeIndex !== -1 && cleanValues[typeIndex] ? cleanValues[typeIndex].toLowerCase() : (Number(cleanValues[amountIndex]) >= 0 ? 'income' : 'expense')
        };
        
        // Validate transaction
        if (isNaN(transaction.amount)) continue;
        
        // Ensure amount sign matches type
        if (transaction.type === 'expense' && transaction.amount > 0) {
            transaction.amount = -Math.abs(transaction.amount);
        } else if (transaction.type === 'income' && transaction.amount < 0) {
            transaction.amount = Math.abs(transaction.amount);
        }
        
        importedTransactions.push(transaction);
        importedCount++;
    }
    
    // Add to existing transactions
    if (importedCount > 0) {
        transactions = [...transactions, ...importedTransactions];
        localStorage.setItem(storageKey, JSON.stringify(transactions));
        init(); // Refresh the UI
        alert(`Successfully imported ${importedCount} transactions!`);
    } else {
        alert('No valid transactions found in the CSV file.');
    }
}

// Event listeners for import functionality
importBtn.addEventListener('click', function() {
    fileInput.click();
});

fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
    }
    
    // Read file
    const reader = new FileReader();
    reader.onload = function(event) {
        importFromCSV(event.target.result);
    };
    reader.onerror = function() {
        alert('Error reading file');
    };
    reader.readAsText(file);
    
    // Reset file input
    fileInput.value = '';
});


// ========================================================================================================================================
// DATA VISUALIZATION 

