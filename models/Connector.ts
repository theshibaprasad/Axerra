import mongoose from 'mongoose';

const ConnectorSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        unique: true, // One connector config per company
    },
    github: {
        org: { type: String },
        token: { type: String }, // Encrypted
    },
    slack: {
        botToken: { type: String }, // Encrypted
        userToken: { type: String }, // Encrypted
        inviteLink: { type: String },
    },
    jira: {
        domain: { type: String },
        email: { type: String },
        token: { type: String }, // Encrypted
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

ConnectorSchema.pre('save', async function () {
    this.updatedAt = new Date();
});

export default mongoose.models.Connector || mongoose.model('Connector', ConnectorSchema);
