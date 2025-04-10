// DOM Elements
const elements = {
    balance: document.getElementById("balance"),
    moneyPlus: document.getElementById("money-plus"),
    moneyMinus: document.getElementById("money-minus"),
    list: document.getElementById("list"),
    form: document.getElementById('form'),
    text: document.getElementById('text'),
    amount: document.getElementById("amount"),
    datetime: document.getElementById("datetime"),
    exportBtn: document.getElementById('exportBtn'),
    gstDisplay: document.getElementById('gst-display'),
    category: document.getElementById('category')
  };
  
  // Constants
  const STORAGE_KEY = "business_transactions";
  const GST_RATES = {
    'Electronics': 18,
    'Utilities': 5,
    'Office Supplies': 12,
    'Non-Taxable': 0
  };
  
  // Initialize transactions array
  let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  
  // Initialize the app
  window.onload = function() {
    setDefaultDateTime();
    renderTransactions();
    updateDashboard();
    setupEventListeners();
  };
  
  // Core Functions
  function addTransaction(e, type) {
    e.preventDefault();
  
    if (!validateForm()) {
      alert("Please fill all fields");
      return;
    }
  
    const transaction = createTransaction(type);
    transactions.push(transaction);
    saveTransactions();
    renderTransaction(transaction);
    updateDashboard();
    resetForm();
  }
  
  function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    init(); // Re-render everything
  }
  
  // Helper Functions
  function createTransaction(type) {
    return {
      id: generateId(),
      text: elements.text.value.trim(),
      amount: type === 'income' ? 
              +elements.amount.value : 
              -elements.amount.value,
      datetime: elements.datetime.value,
      category: elements.category.value,
      type: type
    };
  }
  
  function validateForm() {
    return elements.text.value.trim() && 
           elements.amount.value.trim() && 
           elements.category.value;
  }
  
  function renderTransactions() {
    elements.list.innerHTML = '';
    transactions.forEach(renderTransaction);
  }
  
  function renderTransaction(transaction) {
    const { datetime, text, amount, id, category } = transaction;
    const date = new Date(datetime);
    
    const item = document.createElement("li");
    item.className = amount < 0 ? 'minus' : 'plus';
    
    item.innerHTML = `
      <div class="transaction-meta">
        <span class="transaction-date">${formatDate(date)}</span>
        <span class="transaction-time">${formatTime(date)}</span>
      </div>
      <span class="transaction-text">${text}</span>
      <span class="transaction-category">${category}</span>
      <span class="transaction-amount">
        ${amount < 0 ? '-' : '+'}₹${Math.abs(amount)}
      </span>
      <button class="delete-btn" onClick="removeTransaction(${id})">X</button>
    `;
    
    elements.list.appendChild(item);
  }
  
  function updateDashboard() {
    const { total, income, expense } = calculateTotals();
    const gstOwed = calculateGST();
    
    elements.balance.textContent = `₹${total.toFixed(2)}`;
    elements.moneyPlus.textContent = `+₹${income.toFixed(2)}`;
    elements.moneyMinus.textContent = `-₹${expense.toFixed(2)}`;
    elements.gstDisplay.textContent = `₹${gstOwed.toFixed(2)}`;
  }
  
  function calculateTotals() {
    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    const income = amounts.filter(amount => amount > 0).reduce((sum, amount) => sum + amount, 0);
    const expense = Math.abs(amounts.filter(amount => amount < 0).reduce((sum, amount) => sum + amount, 0));
    
    return { total, income, expense };
  }
  
  function calculateGST() {
    return transactions
      .filter(t => t.type === 'expense' && GST_RATES[t.category])
      .reduce((sum, t) => sum + (Math.abs(t.amount) * (GST_RATES[t.category] / 100), 0));
  }
  
  // Utility Functions
  function formatDate(date) {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  
  function formatTime(date) {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  
  function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }
  
  function setDefaultDateTime() {
    const now = new Date();
    const formattedNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
    elements.datetime.value = formattedNow;
  }
  
  function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }
  
  function resetForm() {
    elements.text.value = '';
    elements.amount.value = '';
    elements.datetime.value = '';
    elements.category.value = '';
    setDefaultDateTime();
  }
  
  // Export Function
  function exportToCSV() {
    if (transactions.length === 0) {
      alert("No transactions to export!");
      return;
    }
  
    const headers = "ID,Description,Amount,Date,Category,Type,GST Rate\n";
    const rows = transactions.map(t => 
      `${t.id},"${t.text}",${t.amount},"${new Date(t.datetime).toLocaleString()}","${t.category}","${t.type}",${GST_RATES[t.category] || 0}`
    );
  
    downloadCSV(headers + rows.join('\n'), 'transactions.csv');
  }
  
  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  // Event Listeners
  function setupEventListeners() {
    document.querySelector('.btn-inc').addEventListener('click', (e) => addTransaction(e, 'income'));
    document.querySelector('.btn-exp').addEventListener('click', (e) => addTransaction(e, 'expense'));
    elements.exportBtn.addEventListener('click', exportToCSV);
  }
  
  // Initialize
  function init() {
    setDefaultDateTime();
    renderTransactions();
    updateDashboard();
    setupEventListeners();
  }
  
  init();