import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manager',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a project name'],
        trim: true,
    },
    projectKey: {
        type: String,
        required: [true, 'Please provide a project key'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    githubTeams: [{
        type: String,
        trim: true,
    }],
    slackChannelName: {
        type: String,
        trim: true,
    },
    assignedEmployees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'on-hold'],
        default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index to ensure unique project names per manager
ProjectSchema.index({ manager: 1, name: 1 }, { unique: true });

// Force overwrite in dev to pick up schema changes
if (process.env.NODE_ENV === 'development' && mongoose.models.Project) {
    delete mongoose.models.Project;
}

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
