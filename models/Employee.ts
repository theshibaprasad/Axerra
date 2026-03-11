import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide an employee name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email for the employee'],
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
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: [true, 'Please assign a role'],
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manager',
        required: [true, 'Please assign a manager'],
    },
    githubProfileLink: {
        type: String,
        maxlength: [255, 'GitHub Profile Link cannot be more than 255 characters'],
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'provisioning', 'deprovisioning'],
        default: 'active',
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

EmployeeSchema.index({ email: 1, company: 1 }, { unique: true });

// Force overwrite in dev to pick up schema changes
if (process.env.NODE_ENV === 'development' && mongoose.models.Employee) {
    delete mongoose.models.Employee;
}

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
