import mongoose from 'mongoose';

const AccessLogSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee', // Or just String if we want to log actions by deleted users
        required: false,
    },
    userId: { type: String }, // Snapshotted ID
    userName: { type: String }, // Snapshotted Name
    app: {
        type: String,
        required: true,
        enum: ['github', 'slack', 'jira', 'system'],
    },
    action: {
        type: String,
        required: true, // e.g., 'provision', 'deprovision', 'update'
    },
    status: {
        type: String,
        required: true,
        enum: ['success', 'failed', 'pending'],
    },
    details: {
        type: String, // Error message or details
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.AccessLog || mongoose.model('AccessLog', AccessLogSchema);
