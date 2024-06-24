const mongoose = require("mongoose");

const MentoringChatSchema = new mongoose.Schema({
    mentorId: {
        type: String,
        required: true
    },
    menteeId: {
        type: String,
        required: true
    },
    messages: [{
        sender: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = mongoose.model("MentoringChat", MentoringChatSchema);