// ===== CONFIG =====
const API_URL = 'http://localhost:5000/api';
let authToken = null;
let currentUser = null;
let goals = [];
let allTransactions = [];

// ===== DOM ELEMENTS =====
const authOverlay = document.getElementById('authOverlay');
const authTitle = document.getElementById('authTitle');
const authSub = document.getElementById('authSub');
const authBtn = document.getElementById('authBtn');
const toggleAuth = document.getElementById('toggleAuth');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authName = document.getElementById('authName');
const authError = document.getElementById('authError');
const appContainer = document.getElementById('appContainer');
const toastContainer = document.getElementById('toastContainer');

// ===== TOAST SYSTEM =====
function showToast(message, type = 'info', duration = 3500) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${icons[type] || 'ℹ️'}</span>
        <span style="flex:1;">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ===== AUTH =====
let isLogin = true;

function updateAuthUI() {
    if (isLogin) {
        authTitle.textContent = 'Welcome back';
        authSub.textContent = 'Sign in to track smarter.';
        authBtn.textContent = 'Sign In';
        document.querySelector('#authSwitch').innerHTML = "Don't have an account? <a id='toggleAuth'>Sign up</a>";
        authName.style.display = 'none';
    } else {
        authTitle.textContent = 'Create account';
        authSub.textContent = 'Start tracking smarter today.';
        authBtn.textContent = 'Sign Up';
        document.querySelector('#authSwitch').innerHTML = "Already have an account? <a id='toggleAuth'>Sign in</a>";
        authName.style.display = 'block';
    }
    authError.style.display = 'none';
    // Re-bind toggle
    document.getElementById('toggleAuth').addEventListener('click', () => {
        isLogin = !isLogin;
        updateAuthUI();
    });
}

document.getElementById('toggleAuth').addEventListener('click', () => {
    isLogin = !isLogin;
    updateAuthUI();
});

async function handleAuth() {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    const name = authName.value.trim();

    if (!email || !password) {
        authError.textContent = 'Please fill in all required fields';
        authError.style.display = 'block';
        return;
    }
    if (!isLogin && !name) {
        authError.textContent = 'Please enter your name';
        authError.style.display = 'block';
        return;
    }

    authBtn.disabled = true;
    authBtn.textContent = isLogin ? 'Signing in...' : 'Creating account...';

    try {
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const body = isLogin ? { email, password } : { email, password, name };
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Authentication failed');

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('finlytics_token', authToken);
        localStorage.setItem('finlytics_user', JSON.stringify(currentUser));

        updateUserInfo();
        authOverlay.classList.add('hidden');
        appContainer.style.display = 'flex';
        showToast(`Welcome ${currentUser.name || 'User'}! 🎉`, 'success');
        loadDashboard();
    } catch (error) {
        authError.textContent = error.message;
        authError.style.display = 'block';
    } finally {
        authBtn.disabled = false;
        authBtn.textContent = isLogin ? 'Sign In' : 'Sign Up';
    }
}

authBtn.addEventListener('click', handleAuth);
authEmail.addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });
authPassword.addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });
authName.addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });

// ===== UPDATE USER INFO =====
function updateUserInfo() {
    const name = currentUser?.name || 'User';
    const email = currentUser?.email || '';
    document.getElementById('userName').textContent = name;
    document.getElementById('userEmail').textContent = email;
    document.getElementById('userAvatar').textContent = name.substring(0, 2).toUpperCase();
    document.getElementById('greetingText').textContent = `Welcome back, ${name.split(' ')[0]}!`;
    const settingsName = document.getElementById('settingsName');
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsCurrency = document.getElementById('settingsCurrency');
    if (settingsName) settingsName.value = name;
    if (settingsEmail) settingsEmail.value = email;
    if (settingsCurrency) settingsCurrency.value = currentUser?.currency || 'USD';
}

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('finlytics_token');
    localStorage.removeItem('finlytics_user');
    authToken = null;
    currentUser = null;
    allTransactions = [];
    appContainer.style.display = 'none';
    authOverlay.classList.remove('hidden');
    isLogin = true;
    updateAuthUI();
    showToast('Logged out successfully 👋', 'info');
});

// ===== CHECK AUTH =====
function checkAuth() {
    const token = localStorage.getItem('finlytics_token');
    const user = localStorage.getItem('finlytics_user');
    if (token && user) {
        try {
            authToken = token;
            currentUser = JSON.parse(user);
            updateUserInfo();
            authOverlay.classList.add('hidden');
            appContainer.style.display = 'flex';
            loadDashboard();
            return true;
        } catch(e) {
            localStorage.removeItem('finlytics_token');
            localStorage.removeItem('finlytics_user');
        }
    }
    return false;
}

// ===== THEME =====
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const themeIcon = themeToggle.querySelector('.material-symbols-rounded');

function setTheme(theme) {
    if (theme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        themeIcon.textContent = 'light_mode';
    } else {
        html.removeAttribute('data-theme');
        themeIcon.textContent = 'dark_mode';
    }
    localStorage.setItem('finlytics-theme', theme);
}

setTheme(localStorage.getItem('finlytics-theme') || 'light');

themeToggle.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
    showToast(`Switched to ${isDark ? 'light' : 'dark'} mode`, 'info', 2000);
});

// ===== API HELPER =====
async function apiRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
    };
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
        // Handle 401 - auto logout
        if (response.status === 401) {
            localStorage.removeItem('finlytics_token');
            localStorage.removeItem('finlytics_user');
            authToken = null;
            appContainer.style.display = 'none';
            authOverlay.classList.remove('hidden');
            showToast('Session expired. Please sign in again.', 'warning');
            throw new Error('Session expired');
        }
        throw new Error(data.error || `Request failed (${response.status})`);
    }
    return data;
}

// ===== CURRENCY =====
const currencySymbols = {
    'USD':'$','EUR':'€','GBP':'£','JPY':'¥','CHF':'Fr','CAD':'C$','AUD':'A$','CNY':'¥',
    'LKR':'Rs ','INR':'₹','SGD':'S$','HKD':'HK$','KRW':'₩','TWD':'NT$','MYR':'RM ',
    'IDR':'Rp ','PHP':'₱','VND':'₫','THB':'฿','ILS':'₪','NOK':'kr ','SEK':'kr ',
    'DKK':'kr ','PLN':'zł ','CZK':'Kč ','HUF':'Ft ','TRY':'₺','RUB':'₽','MXN':'$',
    'BRL':'R$','ARS':'$','CLP':'$','COP':'$','PEN':'S/','AED':'د.إ ','SAR':'﷼',
    'ZAR':'R ','EGP':'£','NGN':'₦','NZD':'NZ$','FJD':'FJ$','BTC':'₿','ETH':'⟠'
};

function getCurrencySymbol(code) { return currencySymbols[code] || '$'; }

function formatCurrency(amount, currencyCode) {
    const code = currencyCode || getCurrency();
    const num = parseFloat(amount) || 0;
    const symbol = getCurrencySymbol(code);
    // Right-side symbol currencies
    if (['SEK','NOK','DKK'].includes(code)) return `${num.toFixed(2)} ${symbol.trim()}`;
    return `${symbol}${num.toFixed(2)}`;
}

function getCurrency() {
    return currentUser?.currency ||
           localStorage.getItem('finlytics_currency') ||
           document.getElementById('settingsCurrency')?.value || 'USD';
}

// ===== HEATMAP =====
function generateHeatmap(transactions) {
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;

    // Build daily spend map for current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dailySpend = {};
    if (transactions) {
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const d = new Date(t.date);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                dailySpend[day] = (dailySpend[day] || 0) + t.amount;
            }
        });
    }

    const amounts = Object.values(dailySpend);
    const maxAmount = amounts.length ? Math.max(...amounts) : 1;

    let html = '';
    for (let day = 1; day <= Math.min(daysInMonth, 49); day++) {
        const amount = dailySpend[day] || 0;
        const level = amount === 0 ? 0 : Math.min(5, Math.ceil((amount / maxAmount) * 5));
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        html += `<div class="heatmap-cell level-${level}" title="${dateStr}: ${formatCurrency(amount)}"></div>`;
    }
    grid.innerHTML = html;
}

// ===== LOAD DASHBOARD =====
async function loadDashboard() {
    try {
        const data = await apiRequest('/dashboard');
        const currency = getCurrency();
        allTransactions = data.recent || [];

        document.getElementById('totalBalance').textContent = formatCurrency(data.balance, currency);
        document.getElementById('totalIncome').textContent = formatCurrency(data.totalIncome, currency);
        document.getElementById('totalExpenses').textContent = formatCurrency(data.totalExpenses, currency);
        document.getElementById('savingsAmount').textContent = formatCurrency(Math.max(0, data.balance), currency);

        document.getElementById('balanceChange').textContent = `${data.count} transaction${data.count !== 1 ? 's' : ''}`;
        document.getElementById('incomeChange').textContent = `↑ This period`;
        document.getElementById('expenseChange').textContent = `↓ This period`;
        document.getElementById('savingsChange').textContent = `${data.savingsRate || 0}% savings rate`;

        // Fix: save sign color based on value
        const balEl = document.getElementById('balanceChange');
        balEl.className = `stat-change ${data.balance >= 0 ? 'positive' : 'negative'}`;

        // Budget overview
        const user = await apiRequest('/budget');
        const totalBudget = Object.values(user).reduce((s, v) => s + v, 0) || 6000;
        const spent = data.totalExpenses;
        const remaining = totalBudget - spent;
        const percent = totalBudget > 0 ? Math.min((spent / totalBudget) * 100, 100) : 0;

        const budgetPercentEl = document.querySelector('.budget-percent');
        const progressBar = document.querySelector('.budget-progress-bar');
        const subtext = document.querySelector('.budget-subtext');
        if (budgetPercentEl) budgetPercentEl.textContent = `${Math.round(percent)}% used`;
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            progressBar.style.background = percent >= 90 ? 'linear-gradient(90deg, #EF4444, #DC2626)' :
                                           percent >= 70 ? 'linear-gradient(90deg, #F59E0B, #D97706)' :
                                           'linear-gradient(90deg, var(--primary), var(--secondary))';
        }
        if (subtext) subtext.textContent = `You've used ${Math.round(percent)}% of your monthly budget.`;
        document.getElementById('monthlyBudget').textContent = formatCurrency(totalBudget, currency);
        document.getElementById('totalSpent').textContent = formatCurrency(spent, currency);
        const remEl = document.getElementById('budgetRemaining');
        if (remEl) {
            remEl.textContent = formatCurrency(remaining, currency);
            remEl.className = `budget-stat-value ${remaining >= 0 ? 'positive' : 'negative'}`;
        }

        // Budget alert
        if (percent >= 90) {
            showToast(`⚠️ Budget alert! You've used ${Math.round(percent)}% of your budget.`, 'warning', 5000);
        }

        renderRecentTransactions(data.recent || []);
        generateHeatmap(data.recent || []);
        updateAnalytics(data);
        updateAllTransactions(data.recent || []);

    } catch (error) {
        if (error.message !== 'Session expired') {
            showToast('Error loading dashboard: ' + error.message, 'error');
        }
    }
}

// ===== RENDER RECENT TRANSACTIONS =====
const txIcons = { Food:'🍽️', Transport:'🚗', Shopping:'🛒', Bills:'🏠', Entertainment:'🎮', Salary:'💼', Freelance:'💻', Other:'📦' };

function renderRecentTransactions(transactions) {
    const txList = document.getElementById('transactionList');
    if (!txList) return;
    const currency = getCurrency();

    if (transactions.length > 0) {
        txList.innerHTML = transactions.slice(0, 8).map(tx => `
            <div class="transaction-item">
                <div class="tx-icon">${txIcons[tx.category] || '💳'}</div>
                <div class="tx-info">
                    <div class="tx-name">${escapeHtml(tx.description)}</div>
                    <div class="tx-date">${formatDate(tx.date)} · ${tx.category}</div>
                </div>
                <div class="tx-amount ${tx.type === 'income' ? 'positive' : 'negative'}">
                    ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount, currency)}
                </div>
            </div>
        `).join('');
    } else {
        txList.innerHTML = '<div class="transaction-item" style="justify-content:center; color:var(--text-secondary); padding:2rem 0;">No transactions yet. Add your first one!</div>';
    }
}

function escapeHtml(text) {
    return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ===== UPDATE ANALYTICS =====
function updateAnalytics(data) {
    const currency = getCurrency();
    const savingsRateEl = document.getElementById('savingsRate');
    const topCategoryEl = document.getElementById('topCategory');
    const avgDailyEl = document.getElementById('avgDaily');

    const rate = parseFloat(data.savingsRate) || 0;
    if (savingsRateEl) {
        savingsRateEl.textContent = `${rate.toFixed(1)}%`;
        savingsRateEl.style.color = rate >= 20 ? 'var(--success)' : rate >= 10 ? 'var(--warning)' : 'var(--error)';
    }

    const categories = data.categoryTotals || {};
    const top = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    if (topCategoryEl) topCategoryEl.textContent = top.length > 0 ? top[0][0] : '—';

    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
    const avgDailyValue = (data.totalExpenses || 0) / daysInMonth;
    if (avgDailyEl) avgDailyEl.textContent = formatCurrency(avgDailyValue, currency);

    const breakdown = document.getElementById('categoryBreakdown');
    if (breakdown) {
        if (top.length > 0) {
            const maxAmount = top[0][1] || 1;
            breakdown.innerHTML = top.map(([cat, amount]) => `
                <div class="category-item">
                    <span>${txIcons[cat] || '💳'} ${cat}</span>
                    <div class="category-bar"><div style="width:${(amount/maxAmount)*100}%;"></div></div>
                    <span>${formatCurrency(amount, currency)}</span>
                </div>
            `).join('');
        } else {
            breakdown.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:1rem;">Add some expenses to see your category breakdown!</p>';
        }
    }
}

// ===== ALL TRANSACTIONS =====
function updateAllTransactions(transactions) {
    const list = document.getElementById('allTransactionsList');
    if (!list) return;
    const currency = getCurrency();

    if (transactions && transactions.length > 0) {
        list.innerHTML = transactions.map(tx => `
            <div class="transaction-item">
                <div class="tx-icon">${txIcons[tx.category] || '💳'}</div>
                <div class="tx-info">
                    <div class="tx-name">${escapeHtml(tx.description)}</div>
                    <div class="tx-date">${tx.category} · ${formatDate(tx.date)}${tx.notes ? ' · ' + escapeHtml(tx.notes) : ''}</div>
                </div>
                <div class="tx-amount ${tx.type === 'income' ? 'positive' : 'negative'}">
                    ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount, currency)}
                </div>
                <button class="btn btn-outline btn-sm delete-tx-btn" data-id="${tx._id}" title="Delete" style="flex-shrink:0;">✕</button>
            </div>
        `).join('');

        list.querySelectorAll('.delete-tx-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                if (!confirm('Delete this transaction?')) return;
                try {
                    await apiRequest(`/transactions/${this.dataset.id}`, { method: 'DELETE' });
                    showToast('Transaction deleted', 'success', 2000);
                    loadDashboard();
                } catch(err) {
                    showToast('Error deleting transaction: ' + err.message, 'error');
                }
            });
        });
    } else {
        list.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:2rem 0;">No transactions found.</div>';
    }
}

// ===== LOAD BUDGETS =====
async function loadBudgets() {
    try {
        const budget = await apiRequest('/budget');
        const container = document.getElementById('budgetManagement');
        if (!container) return;
        const currency = getCurrency();

        const entries = Object.entries(budget);
        if (entries.length > 0) {
            container.innerHTML = entries.map(([category, amount]) => `
                <div class="budget-item">
                    <span class="budget-name">${txIcons[category] || '💰'} ${category}</span>
                    <span class="budget-amount">${formatCurrency(amount, currency)}/month</span>
                    <div class="budget-actions">
                        <button class="btn btn-outline btn-sm edit-budget-btn" data-category="${category}" data-amount="${amount}">Edit</button>
                        <button class="btn btn-outline btn-sm delete-budget-btn" data-category="${category}" style="color:var(--error);">Delete</button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:2rem 0;">No budgets set yet. Click <strong>+ Add Budget</strong> to get started.</p>';
        }

        container.querySelectorAll('.edit-budget-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                openEditBudget(this.dataset.category, parseFloat(this.dataset.amount));
            });
        });
        container.querySelectorAll('.delete-budget-btn').forEach(btn => {
            btn.addEventListener('click', function() { deleteBudget(this.dataset.category); });
        });

    } catch (error) {
        console.error('Budget error:', error);
        showToast('Error loading budgets', 'error');
    }
}

// ===== BUDGET MODAL =====
const budgetModal = document.getElementById('addBudgetModal');
const budgetForm = document.getElementById('budgetForm');
let isEditingBudget = false;

document.getElementById('addBudgetBtn')?.addEventListener('click', () => {
    isEditingBudget = false;
    document.getElementById('budgetModalTitle').textContent = 'Add Budget Category';
    document.getElementById('budgetSubmitBtn').textContent = 'Add Budget';
    document.getElementById('editBudgetCategory').value = '';
    document.getElementById('budgetCategory').value = 'Food';
    document.getElementById('budgetAmount').value = '';
    document.getElementById('budgetFormError').style.display = 'none';
    budgetModal.style.display = 'flex';
});

function openEditBudget(category, amount) {
    isEditingBudget = true;
    document.getElementById('budgetModalTitle').textContent = `Edit ${category} Budget`;
    document.getElementById('budgetSubmitBtn').textContent = 'Update Budget';
    document.getElementById('editBudgetCategory').value = category;
    document.getElementById('budgetCategory').value = category;
    document.getElementById('budgetAmount').value = amount;
    document.getElementById('budgetFormError').style.display = 'none';
    budgetModal.style.display = 'flex';
}

document.getElementById('closeBudgetModalBtn')?.addEventListener('click', () => { budgetModal.style.display = 'none'; });
budgetModal?.addEventListener('click', e => { if (e.target === budgetModal) budgetModal.style.display = 'none'; });

budgetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formError = document.getElementById('budgetFormError');
    formError.style.display = 'none';

    const category = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);

    if (!amount || amount <= 0) {
        formError.textContent = 'Please enter a valid amount';
        formError.style.display = 'block';
        return;
    }

    try {
        await apiRequest('/budget', { method: 'PUT', body: JSON.stringify({ category, amount }) });
        budgetModal.style.display = 'none';
        showToast(`✅ Budget for ${category} ${isEditingBudget ? 'updated' : 'added'}!`, 'success');
        loadBudgets();
        loadDashboard();
        budgetForm.reset();
    } catch (error) {
        formError.textContent = error.message;
        formError.style.display = 'block';
    }
});

async function deleteBudget(category) {
    if (!confirm(`Delete budget for ${category}?`)) return;
    try {
        await apiRequest(`/budget/${encodeURIComponent(category)}`, { method: 'DELETE' });
        showToast(`Budget for ${category} deleted`, 'success');
        loadBudgets();
        loadDashboard();
    } catch (error) {
        showToast('Error deleting budget: ' + error.message, 'error');
    }
}

// ===== ADD TRANSACTION MODAL =====
const modal = document.getElementById('addExpenseModal');
const form = document.getElementById('expenseForm');

document.getElementById('addExpenseBtn')?.addEventListener('click', () => {
    modal.style.display = 'flex';
    document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
    setTimeout(() => document.getElementById('txDescription')?.focus(), 50);
});

document.getElementById('closeModalBtn')?.addEventListener('click', () => { modal.style.display = 'none'; });
modal?.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formError = document.getElementById('formError');
    formError.style.display = 'none';

    const description = document.getElementById('txDescription').value.trim();
    const amount = parseFloat(document.getElementById('txAmount').value);
    const type = document.getElementById('txType').value;
    const category = document.getElementById('txCategory').value;
    const date = document.getElementById('txDate').value;
    const notes = document.getElementById('txNotes').value.trim();

    if (!description) { formError.textContent = 'Please enter a description'; formError.style.display = 'block'; return; }
    if (!amount || amount <= 0) { formError.textContent = 'Please enter a valid amount'; formError.style.display = 'block'; return; }

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
        await apiRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify({ description, amount, type, category, date: date || new Date().toISOString().split('T')[0], notes })
        });
        modal.style.display = 'none';
        showToast('Transaction added successfully ✅', 'success');
        loadDashboard();
        form.reset();
        document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
    } catch (error) {
        formError.textContent = error.message;
        formError.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save';
    }
});

// ===== REPORTS =====
async function generateReport() {
    try {
        showToast('Generating report...', 'info', 2000);
        const transactions = await apiRequest('/transactions?limit=1000');
        const reportType = document.getElementById('reportType')?.value || 'monthly';
        const currency = getCurrency();
        const now = new Date();
        let filtered = transactions;
        let periodLabel = '';

        if (reportType === 'monthly') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = transactions.filter(t => new Date(t.date) >= start);
            periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        } else if (reportType === 'quarterly') {
            const quarter = Math.floor(now.getMonth() / 3);
            const start = new Date(now.getFullYear(), quarter * 3, 1);
            filtered = transactions.filter(t => new Date(t.date) >= start);
            periodLabel = `Q${quarter + 1} ${now.getFullYear()}`;
        } else {
            const start = new Date(now.getFullYear(), 0, 1);
            filtered = transactions.filter(t => new Date(t.date) >= start);
            periodLabel = `Year ${now.getFullYear()}`;
        }

        const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const netProfit = totalIncome - totalExpenses;

        document.getElementById('reportIncome').textContent = formatCurrency(totalIncome, currency);
        document.getElementById('reportExpenses').textContent = formatCurrency(totalExpenses, currency);
        const profitEl = document.getElementById('reportProfit');
        profitEl.textContent = formatCurrency(netProfit, currency);
        profitEl.style.color = netProfit >= 0 ? 'var(--success)' : 'var(--error)';
        document.getElementById('reportCount').textContent = filtered.length;

        generateReportChart(filtered);
        showToast(`Report generated for ${periodLabel} (${filtered.length} transactions)`, 'success');
    } catch (error) {
        showToast('Error generating report: ' + error.message, 'error');
    }
}

function generateReportChart(transactions) {
    const container = document.getElementById('reportBarContainer');
    if (!container) return;

    const monthlyData = {};
    transactions.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthlyData[key]) monthlyData[key] = { label, income: 0, expense: 0 };
        if (t.type === 'income') monthlyData[key].income += t.amount;
        else monthlyData[key].expense += t.amount;
    });

    const months = Object.keys(monthlyData).sort();
    if (months.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:1rem;">No data for this period</p>';
        return;
    }

    const maxValue = Math.max(...months.map(m => Math.max(monthlyData[m].income, monthlyData[m].expense)), 1);
    const currency = getCurrency();

    container.innerHTML = months.map(key => {
        const { label, income, expense } = monthlyData[key];
        return `
            <div class="report-bar-group">
                <div class="report-bar-label">${label}</div>
                <div class="report-bar-row">
                    <div class="report-bar income-bar" style="width:${(income/maxValue)*80}%; min-width:${income>0?'40px':'0'};" title="Income: ${formatCurrency(income, currency)}">
                        ${income > 0 ? formatCurrency(income, currency) : ''}
                    </div>
                    <div class="report-bar expense-bar" style="width:${(expense/maxValue)*80}%; min-width:${expense>0?'40px':'0'};" title="Expense: ${formatCurrency(expense, currency)}">
                        ${expense > 0 ? formatCurrency(expense, currency) : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);

document.getElementById('exportReportPdf')?.addEventListener('click', async () => {
    try {
        showToast('Generating PDF...', 'info');
        const transactions = await apiRequest('/transactions?limit=1000');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const currency = getCurrency();

        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        doc.text('Finlytics Financial Report', 20, 20);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        doc.text(`User: ${currentUser?.name || 'User'} (${currentUser?.email || ''})`, 20, 37);

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const balance = totalIncome - totalExpenses;

        doc.setFontSize(13);
        doc.text('Summary', 20, 50);
        doc.setFontSize(11);
        doc.text(`Total Income: ${formatCurrency(totalIncome, currency)}`, 20, 60);
        doc.text(`Total Expenses: ${formatCurrency(totalExpenses, currency)}`, 20, 68);
        doc.text(`Net Balance: ${formatCurrency(balance, currency)}`, 20, 76);
        doc.text(`Total Transactions: ${transactions.length}`, 20, 84);

        if (transactions.length > 0) {
            doc.autoTable({
                startY: 95,
                head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
                body: transactions.slice(0, 100).map(t => [
                    formatDate(t.date),
                    t.description.substring(0, 30),
                    t.category,
                    t.type.charAt(0).toUpperCase() + t.type.slice(1),
                    `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, currency)}`
                ]),
                theme: 'striped',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [37, 99, 235] },
                columnStyles: { 4: { halign: 'right' } }
            });
        }

        doc.save(`finlytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('PDF exported successfully! ✅', 'success');
    } catch (error) {
        showToast('Error exporting PDF: ' + error.message, 'error');
    }
});

document.getElementById('exportReportCsv')?.addEventListener('click', async () => {
    try {
        const transactions = await apiRequest('/transactions?limit=1000');
        exportToCsv(transactions, 'finlytics-report');
    } catch (error) {
        showToast('Error exporting CSV: ' + error.message, 'error');
    }
});

// ===== GOALS =====
function loadGoals() {
    const container = document.getElementById('goalsList');
    if (!container) return;

    const saved = localStorage.getItem('finlytics_goals');
    if (saved) {
        try { goals = JSON.parse(saved); } catch(e) { goals = []; }
    }

    if (goals.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:2rem 0;">No financial goals yet. Add your first goal to get started!</p>';
        return;
    }

    const currency = getCurrency();
    container.innerHTML = goals.map((goal, index) => {
        const pct = Math.min((goal.current / goal.target) * 100, 100);
        const isComplete = pct >= 100;
        return `
            <div class="goal-item">
                <div class="goal-info">
                    <div class="goal-name">${isComplete ? '🏆' : '🎯'} ${escapeHtml(goal.name)}</div>
                    <div class="goal-details">Target: ${formatCurrency(goal.target, currency)} · Saved: ${formatCurrency(goal.current, currency)} · ${formatCurrency(goal.target - goal.current, currency)} to go</div>
                </div>
                <div class="goal-progress">
                    <div class="goal-progress-bar" style="background:var(--border); border-radius:20px; height:8px; flex:1; overflow:hidden; min-width:100px;">
                        <div style="width:${pct}%; height:100%; background:${isComplete ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), var(--secondary))'}; border-radius:20px; transition:width 0.6s;"></div>
                    </div>
                    <span class="goal-percentage" style="color:${isComplete ? 'var(--success)' : 'var(--text-primary)'};">${Math.round(pct)}%</span>
                </div>
                <div class="goal-actions">
                    <button class="btn btn-outline btn-sm edit-goal-btn" data-index="${index}">Edit</button>
                    <button class="btn btn-outline btn-sm delete-goal-btn" data-index="${index}" style="color:var(--error);">Delete</button>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.edit-goal-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const g = goals[parseInt(this.dataset.index)];
            document.getElementById('goalName').value = g.name;
            document.getElementById('goalTarget').value = g.target;
            document.getElementById('goalCurrent').value = g.current;
            document.getElementById('goalFormError').style.display = 'none';
            const gModal = document.getElementById('addGoalModal');
            gModal.dataset.editIndex = this.dataset.index;
            gModal.style.display = 'flex';
        });
    });

    container.querySelectorAll('.delete-goal-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            if (confirm(`Delete goal "${goals[idx].name}"?`)) {
                goals.splice(idx, 1);
                localStorage.setItem('finlytics_goals', JSON.stringify(goals));
                loadGoals();
                showToast('Goal deleted', 'success');
            }
        });
    });
}

const goalModal = document.getElementById('addGoalModal');
const goalForm = document.getElementById('goalForm');

document.getElementById('addGoalBtn')?.addEventListener('click', () => {
    goalForm.reset();
    document.getElementById('goalFormError').style.display = 'none';
    delete goalModal.dataset.editIndex;
    goalModal.style.display = 'flex';
});

document.getElementById('closeGoalModalBtn')?.addEventListener('click', () => { goalModal.style.display = 'none'; });
goalModal?.addEventListener('click', e => { if (e.target === goalModal) goalModal.style.display = 'none'; });

goalForm?.addEventListener('submit', e => {
    e.preventDefault();
    const formError = document.getElementById('goalFormError');
    formError.style.display = 'none';

    const name = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    const current = parseFloat(document.getElementById('goalCurrent').value);

    if (!name) { formError.textContent = 'Please enter a goal name'; formError.style.display = 'block'; return; }
    if (!target || target <= 0) { formError.textContent = 'Please enter a valid target amount'; formError.style.display = 'block'; return; }
    if (isNaN(current) || current < 0) { formError.textContent = 'Please enter a valid current amount'; formError.style.display = 'block'; return; }
    if (current > target) { formError.textContent = 'Current amount cannot exceed target'; formError.style.display = 'block'; return; }

    const editIdx = goalModal.dataset.editIndex;
    if (editIdx !== undefined) {
        goals[editIdx] = { name, target, current };
        showToast(`Goal "${name}" updated! ✅`, 'success');
    } else {
        goals.push({ name, target, current });
        showToast(`Goal "${name}" added! ✅`, 'success');
    }

    localStorage.setItem('finlytics_goals', JSON.stringify(goals));
    goalModal.style.display = 'none';
    loadGoals();
    goalForm.reset();
});

// ===== SETTINGS =====
document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('settingsName').value.trim();
    const email = document.getElementById('settingsEmail').value.trim();
    const currency = document.getElementById('settingsCurrency').value;

    if (!name || !email) { showToast('Please fill in all fields', 'warning'); return; }

    try {
        // Update API if available
        try {
            await apiRequest('/user/profile', { method: 'PUT', body: JSON.stringify({ name, currency }) });
        } catch(e) { /* endpoint might not exist yet */ }

        currentUser = { ...currentUser, name, email, currency };
        localStorage.setItem('finlytics_user', JSON.stringify(currentUser));
        localStorage.setItem('finlytics_currency', currency);
        updateUserInfo();
        showToast(`Profile saved! Currency: ${currency} ✅`, 'success');
        loadDashboard();
    } catch (error) {
        showToast('Error saving profile: ' + error.message, 'error');
    }
});

document.getElementById('savePreferencesBtn')?.addEventListener('click', () => {
    const defaultView = document.getElementById('settingsDefaultView').value;
    const notifications = document.getElementById('settingsNotifications').checked;
    const budgetAlerts = document.getElementById('settingsBudgetAlerts').checked;
    const darkMode = document.getElementById('settingsDarkMode').checked;
    localStorage.setItem('finlytics_preferences', JSON.stringify({ defaultView, notifications, budgetAlerts, darkMode }));
    setTheme(darkMode ? 'dark' : 'light');
    showToast('Preferences saved! ✅', 'success');
});

function loadSettings() {
    if (currentUser) {
        const el = (id) => document.getElementById(id);
        if (el('settingsName')) el('settingsName').value = currentUser.name || '';
        if (el('settingsEmail')) el('settingsEmail').value = currentUser.email || '';
        if (el('settingsCurrency')) el('settingsCurrency').value = currentUser.currency || 'USD';
    }
    const saved = localStorage.getItem('finlytics_preferences');
    if (saved) {
        try {
            const prefs = JSON.parse(saved);
            const el = (id) => document.getElementById(id);
            if (el('settingsDefaultView')) el('settingsDefaultView').value = prefs.defaultView || 'dashboard';
            if (el('settingsNotifications')) el('settingsNotifications').checked = prefs.notifications !== false;
            if (el('settingsBudgetAlerts')) el('settingsBudgetAlerts').checked = prefs.budgetAlerts !== false;
            if (el('settingsDarkMode')) el('settingsDarkMode').checked = prefs.darkMode || false;
        } catch(e) {}
    }
}

// ===== EXPORT / IMPORT HELPERS =====
function exportToCsv(transactions, filename) {
    if (!transactions || transactions.length === 0) {
        showToast('No transactions to export', 'warning');
        return;
    }
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Notes'];
    const rows = transactions.map(tx => [
        formatDate(tx.date),
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.category,
        tx.type,
        tx.amount.toFixed(2),
        `"${(tx.notes || '').replace(/"/g, '""')}"`
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${transactions.length} transactions ✅`, 'success');
}

document.getElementById('exportCsvBtn')?.addEventListener('click', async () => {
    try {
        showToast('Preparing export...', 'info', 2000);
        const transactions = await apiRequest('/transactions?limit=1000');
        exportToCsv(transactions, 'finlytics-transactions');
    } catch (error) {
        showToast('Error exporting: ' + error.message, 'error');
    }
});

document.getElementById('exportPdfBtn')?.addEventListener('click', async () => {
    try {
        showToast('Generating PDF...', 'info', 2000);
        const transactions = await apiRequest('/transactions?limit=1000');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const currency = getCurrency();

        doc.setFontSize(20);
        doc.setTextColor(37, 99, 235);
        doc.text('Finlytics Transactions Report', 20, 20);
        doc.setTextColor(0,0,0);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()} | User: ${currentUser?.name}`, 20, 28);

        const totalIncome = transactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);

        doc.setFontSize(12);
        doc.text(`Income: ${formatCurrency(totalIncome, currency)}  |  Expenses: ${formatCurrency(totalExpenses, currency)}  |  Balance: ${formatCurrency(totalIncome - totalExpenses, currency)}`, 20, 38);

        doc.autoTable({
            startY: 48,
            head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
            body: transactions.map(t => [
                formatDate(t.date),
                t.description.substring(0, 35),
                t.category,
                t.type === 'income' ? 'Income' : 'Expense',
                `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, currency)}`
            ]),
            theme: 'striped',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [37, 99, 235] },
            columnStyles: { 4: { halign: 'right' } }
        });

        doc.save(`finlytics-${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('PDF exported ✅', 'success');
    } catch (error) {
        showToast('Error generating PDF: ' + error.message, 'error');
    }
});

// ===== CSV IMPORT =====
document.getElementById('importCsvBtn')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async ev => {
            try {
                showToast('Parsing CSV...', 'info', 2000);
                const text = ev.target.result;
                const lines = text.split('\n').filter(l => l.trim());
                if (lines.length < 2) { showToast('CSV is empty or invalid', 'error'); return; }

                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
                const required = ['description', 'amount', 'type', 'category'];
                const missing = required.filter(r => !headers.includes(r));
                if (missing.length > 0) {
                    showToast(`Missing columns: ${missing.join(', ')}. Required: ${required.join(', ')}`, 'error', 6000);
                    return;
                }

                const getIdx = name => headers.indexOf(name);
                const rows = [];
                let skipped = 0;

                for (let i = 1; i < lines.length; i++) {
                    // Handle quoted CSV fields properly
                    const vals = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g) || lines[i].split(',');
                    const v = vals.map(x => (x || '').trim().replace(/^"|"$/g, ''));
                    
                    const desc = v[getIdx('description')] || '';
                    const amount = parseFloat(v[getIdx('amount')]);
                    const type = (v[getIdx('type')] || '').toLowerCase().trim();
                    const category = v[getIdx('category')] || 'Other';
                    const dateVal = getIdx('date') >= 0 ? v[getIdx('date')] : '';
                    const notes = getIdx('notes') >= 0 ? v[getIdx('notes')] : '';

                    if (!desc || isNaN(amount) || amount <= 0 || !['income','expense'].includes(type)) {
                        skipped++;
                        continue;
                    }

                    let date;
                    try { date = dateVal ? new Date(dateVal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]; }
                    catch(e) { date = new Date().toISOString().split('T')[0]; }

                    rows.push({ description: desc, amount, type, category, date, notes });
                }

                if (rows.length === 0) { showToast(`No valid rows found. ${skipped} skipped.`, 'warning'); return; }
                if (!confirm(`Import ${rows.length} transactions? (${skipped} invalid rows will be skipped)`)) return;

                let ok = 0, fail = 0;
                for (const row of rows) {
                    try { await apiRequest('/transactions', { method: 'POST', body: JSON.stringify(row) }); ok++; }
                    catch(e) { fail++; }
                }

                showToast(`Imported ${ok} transactions! ${fail > 0 ? `(${fail} failed)` : ''} ${skipped > 0 ? `(${skipped} skipped)` : ''}`, ok > 0 ? 'success' : 'warning');
                loadDashboard();
            } catch(error) {
                showToast('Error importing CSV: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

// ===== EXPORT/IMPORT ALL DATA =====
document.getElementById('exportAllDataBtn')?.addEventListener('click', async () => {
    try {
        showToast('Exporting all data...', 'info', 2000);
        const [transactions, budget] = await Promise.all([
            apiRequest('/transactions?limit=1000'),
            apiRequest('/budget')
        ]);
        const allData = { transactions, budget, goals, user: currentUser, currency: getCurrency(), exportedAt: new Date().toISOString(), version: '2.0' };
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finlytics-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('All data exported ✅', 'success');
    } catch(error) {
        showToast('Error exporting: ' + error.message, 'error');
    }
});

document.getElementById('importAllDataBtn')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async ev => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!confirm(`Import ${data.transactions?.length || 0} transactions and ${data.goals?.length || 0} goals?`)) return;

                if (data.currency) {
                    if (currentUser) currentUser.currency = data.currency;
                    localStorage.setItem('finlytics_currency', data.currency);
                }

                let imported = 0;
                if (data.transactions?.length > 0) {
                    for (const tx of data.transactions) {
                        try { await apiRequest('/transactions', { method: 'POST', body: JSON.stringify(tx) }); imported++; }
                        catch(e) {}
                    }
                }
                if (data.budget) {
                    for (const [cat, amt] of Object.entries(data.budget)) {
                        try { await apiRequest('/budget', { method: 'PUT', body: JSON.stringify({ category: cat, amount: amt }) }); }
                        catch(e) {}
                    }
                }
                if (data.goals?.length > 0) {
                    goals = data.goals;
                    localStorage.setItem('finlytics_goals', JSON.stringify(goals));
                }

                showToast(`Import complete! ${imported} transactions imported. ✅`, 'success');
                loadDashboard();
                loadSettings();
            } catch(error) {
                showToast('Error importing: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

document.getElementById('clearAllDataBtn')?.addEventListener('click', async () => {
    if (!confirm('⚠️ This will permanently delete ALL your transactions and budgets. Are you sure?')) return;
    if (!confirm('⚠️ FINAL WARNING: This action cannot be undone!')) return;
    try {
        showToast('Clearing data...', 'info', 2000);
        const [transactions, budget] = await Promise.all([
            apiRequest('/transactions?limit=1000'),
            apiRequest('/budget')
        ]);
        await Promise.all(transactions.map(tx => apiRequest(`/transactions/${tx._id}`, { method: 'DELETE' }).catch(()=>{})));
        await Promise.all(Object.keys(budget).map(cat => apiRequest(`/budget/${encodeURIComponent(cat)}`, { method: 'DELETE' }).catch(()=>{})));
        goals = [];
        localStorage.setItem('finlytics_goals', JSON.stringify(goals));
        showToast('All data cleared ✅', 'success');
        loadDashboard();
    } catch(error) {
        showToast('Error clearing data: ' + error.message, 'error');
    }
});

// ===== NAVIGATION =====
const views = ['dashboard', 'transactions', 'budgets', 'analytics', 'reports', 'goals', 'settings'];

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', function() {
        const page = this.dataset.page;
        document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
        this.classList.add('active');

        views.forEach(v => {
            const el = document.getElementById(`${v}View`);
            if (el) el.style.display = v === page ? 'block' : 'none';
        });

        const titles = { dashboard:'Dashboard', transactions:'Transactions', budgets:'Budgets', analytics:'Analytics', reports:'Reports', goals:'Goals', settings:'Settings' };
        document.getElementById('pageTitle').textContent = titles[page] || page;

        if (page === 'budgets') loadBudgets();
        else if (page === 'analytics') loadDashboard();
        else if (page === 'reports') generateReport();
        else if (page === 'goals') loadGoals();
        else if (page === 'settings') loadSettings();
        else if (page === 'transactions') {
            apiRequest('/transactions?limit=500').then(t => { allTransactions = t; updateAllTransactions(t); }).catch(()=>{});
        }
    });
});

// ===== QUICK LINKS =====
document.getElementById('viewAllTransactions')?.addEventListener('click', () => {
    document.querySelector('.nav-item[data-page="transactions"]')?.click();
});
document.getElementById('viewBudgetBtn')?.addEventListener('click', () => {
    document.querySelector('.nav-item[data-page="budgets"]')?.click();
});
document.getElementById('upgradeBtn')?.addEventListener('click', () => {
    showToast('⭐ Pro upgrade — coming soon!', 'info');
});

// ===== FILTERS & SEARCH =====
document.getElementById('applyFilterBtn')?.addEventListener('click', async () => {
    const start = document.getElementById('filterStartDate')?.value;
    const end = document.getElementById('filterEndDate')?.value;
    if (!start && !end) { showToast('Please select at least one date', 'warning'); return; }
    try {
        const params = new URLSearchParams();
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        const data = await apiRequest(`/transactions?${params}`);
        updateAllTransactions(data);
        showToast(`Showing ${data.length} transactions`, 'info', 2000);
    } catch(error) {
        showToast('Error filtering: ' + error.message, 'error');
    }
});

document.getElementById('clearFilterBtn')?.addEventListener('click', () => {
    const s = document.getElementById('filterStartDate');
    const e = document.getElementById('filterEndDate');
    if (s) s.value = '';
    if (e) e.value = '';
    const search = document.getElementById('searchTransactions');
    if (search) search.value = '';
    apiRequest('/transactions?limit=500').then(t => updateAllTransactions(t)).catch(()=>{});
    showToast('Filters cleared', 'info', 2000);
});

let searchTimeout;
document.getElementById('searchTransactions')?.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const query = this.value.trim();
        if (!query) {
            apiRequest('/transactions?limit=500').then(t => updateAllTransactions(t)).catch(()=>{});
            return;
        }
        try {
            const data = await apiRequest(`/transactions?search=${encodeURIComponent(query)}`);
            updateAllTransactions(data);
        } catch(error) {
            showToast('Search error: ' + error.message, 'error');
        }
    }, 300);
});

// ===== INIT =====
if (!checkAuth()) {
    appContainer.style.display = 'none';
    authOverlay.classList.remove('hidden');
    updateAuthUI();
}



