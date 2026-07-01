const Joi = require('joi');

// Transaction validation schema
const transactionSchema = Joi.object({
    description: Joi.string().required().max(200).messages({
        'string.empty': 'Description is required',
        'string.max': 'Description must be less than 200 characters'
    }),
    amount: Joi.number().positive().required().messages({
        'number.positive': 'Amount must be greater than 0',
        'any.required': 'Amount is required'
    }),
    type: Joi.string().valid('income', 'expense').required(),
    category: Joi.string().valid('Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Salary', 'Freelance', 'Other').required(),
    date: Joi.date().default(Date.now),
    notes: Joi.string().max(500).allow(''),
    recurring: Joi.boolean().default(false),
    recurringFrequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').when('recurring', {
        is: true,
        then: Joi.required()
    })
});

// User validation schema
const userSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    }),
    name: Joi.string().required().max(100).messages({
        'any.required': 'Name is required',
        'string.max': 'Name must be less than 100 characters'
    })
});

// Budget validation schema
const budgetSchema = Joi.object({
    category: Joi.string().required(),
    amount: Joi.number().positive().required().messages({
        'number.positive': 'Budget amount must be greater than 0'
    })
});

function validateTransaction(req, res, next) {
    const { error } = transactionSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

function validateUser(req, res, next) {
    const { error } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

function validateBudget(req, res, next) {
    const { error } = budgetSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

module.exports = { validateTransaction, validateUser, validateBudget };