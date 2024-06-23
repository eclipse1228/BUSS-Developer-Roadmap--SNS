const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    id: { 
        type: String, 
        required: true, 
        unique: true 
    },
    pw: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    age: { 
        type: Number, 
        required: true 
    },
    email: {
        type: String,
        required: true
    },
    job: {
        type: String,
        required: false
    },
    profileImageUrl: {
        type: String,
        required: false
    },
    githubUsername: {
        type: String,
        required: false
    },
    roadmaps: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap'
    }]
});

module.exports = mongoose.model("User", UserSchema);
