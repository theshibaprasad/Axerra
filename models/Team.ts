import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a team name'],
        trim: true,
    },
    githubTeam: {
        type: String, // e.g., 'backend-team'
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index to ensure unique team names per company
TeamSchema.index({ company: 1, name: 1 }, { unique: true });

// Force overwrite in dev to pick up schema changes
if (process.env.NODE_ENV === 'development' && mongoose.models.Team) {
    delete mongoose.models.Team;
}

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
