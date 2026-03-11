import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a role name'],
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index to ensure unique role names per company
RoleSchema.index({ company: 1, name: 1 }, { unique: true });

export default mongoose.models.Role || mongoose.model('Role', RoleSchema);
