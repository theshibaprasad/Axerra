import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const CompanySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a company name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email for the HR'],
        unique: true,
        maxlength: [100, 'Email cannot be more than 100 characters'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address',
        ],
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        maxlength: [20, 'Phone number cannot be more than 20 characters'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Don't return password by default
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Encrypt password using bcrypt
CompanySchema.pre('save', async function () {
    const company = this as any;
    if (!company.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    company.password = await bcrypt.hash(company.password, salt);
});

export default mongoose.models.Company || mongoose.model('Company', CompanySchema);
