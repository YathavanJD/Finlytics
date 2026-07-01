const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    budget: {
        type: Map,
        of: Number,
        default: {
            Food: 500,
            Transport: 200,
            Shopping: 300,
            Bills: 400,
            Entertainment: 150,
            Other: 200
        }
    },
    settings: {
        theme: { type: String, default: 'light' },
        notifications: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);