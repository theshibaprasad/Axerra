import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ManagerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a manager name'],
        trim: true,
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email for the manager'],
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
    managerId: {
        type: String,
        required: [true, 'Please provide a unique manager ID'],
        unique: true,
        maxlength: [50, 'Manager ID cannot be more than 50 characters'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Don't return password by default when querying managers
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Encrypt password using bcrypt before saving
ManagerSchema.pre('save', async function () {
    const manager = this;
    if (!manager.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    manager.password = await bcrypt.hash(manager.password, salt);
});

export default mongoose.models.Manager || mongoose.model('Manager', ManagerSchema);
