const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validateTransaction, validateUser, validateBudget } = require('../middleware/validation');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// ===== AUTH ROUTES =====
router.post('/auth/register', validateUser, async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const user = new User({ email, password, name });
        await user.save();
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.status(201).json({
            token,
            user: { id: user._id, email: user.email, name: user.name }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.json({
            token,
            user: { id: user._id, email: user.email, name: user.name }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ===== TRANSACTION ROUTES =====
router.get('/transactions', authenticate, async (req, res) => {
    try {
        const { start, end, category, type, search } = req.query;
        const query = { userId: req.userId };

        // Date filter
        if (start && end) {
            query.date = { $gte: new Date(start), $lte: new Date(end) };
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Type filter
        if (type) {
            query.type = type;
        }

        // Search
        if (search) {
            query.$or = [
                { description: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        const transactions = await Transaction.find(query)
            .sort({ date: -1 })
            .limit(100);

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/transactions', authenticate, validateTransaction, async (req, res) => {
    try {
        const { description, amount, type, category, date, notes, recurring, recurringFrequency } = req.body;
        const transaction = new Transaction({
            userId: req.userId,
            description,
            amount,
            type,
            category,
            date: date || new Date(),
            notes,
            recurring: recurring || false,
            recurringFrequency
        });
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/transactions/:id', authenticate, validateTransaction, async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/transactions/:id', authenticate, async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== DASHBOARD DATA =====
router.get('/dashboard', authenticate, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId });

        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryTotals = {};
        const monthlyTrend = {};

        transactions.forEach(tx => {
            if (tx.type === 'income') {
                totalIncome += tx.amount;
            } else {
                totalExpenses += tx.amount;
                categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
            }

            // Monthly trend
            const month = tx.date.toISOString().slice(0, 7);
            if (!monthlyTrend[month]) {
                monthlyTrend[month] = { income: 0, expense: 0 };
            }
            if (tx.type === 'income') {
                monthlyTrend[month].income += tx.amount;
            } else {
                monthlyTrend[month].expense += tx.amount;
            }
        });

        const balance = totalIncome - totalExpenses;

        // Get recent transactions
        const recent = await Transaction.find({ userId: req.userId })
            .sort({ date: -1 })
            .limit(10);

        // Calculate savings rate
        const savingsRate = totalIncome > 0 ? ((balance) / totalIncome * 100).toFixed(1) : 0;

        res.json({
            balance,
            totalIncome,
            totalExpenses,
            categoryTotals,
            recent,
            count: transactions.length,
            savingsRate,
            monthlyTrend: Object.entries(monthlyTrend).map(([month, data]) => ({
                month,
                income: data.income,
                expense: data.expense,
                savings: data.income - data.expense
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== BUDGET ROUTES =====
router.get('/budget', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json(user.budget);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/budget', authenticate, validateBudget, async (req, res) => {
    try {
        const { category, amount } = req.body;
        const user = await User.findById(req.userId);
        user.budget.set(category, amount);
        await user.save();
        res.json(user.budget);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/budget/:category', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        user.budget.delete(req.params.category);
        await user.save();
        res.json(user.budget);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ===== ANALYTICS =====
router.get('/analytics', authenticate, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId });

        // Category breakdown
        const categoryBreakdown = {};
        const monthlyData = {};
        const topCategories = [];

        transactions.forEach(tx => {
            if (tx.type === 'expense') {
                categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amount;
                const month = tx.date.toISOString().slice(0, 7);
                if (!monthlyData[month]) monthlyData[month] = { expense: 0, income: 0 };
                monthlyData[month].expense += tx.amount;
            } else {
                const month = tx.date.toISOString().slice(0, 7);
                if (!monthlyData[month]) monthlyData[month] = { expense: 0, income: 0 };
                monthlyData[month].income += tx.amount;
            }
        });

        // Top 5 spending categories
        const sorted = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
        const top5 = sorted.slice(0, 5);

        res.json({
            categoryBreakdown,
            topCategories: top5,
            monthlyData,
            totalTransactions: transactions.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;