const mongoose = require('mongoose');

const agentSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;
