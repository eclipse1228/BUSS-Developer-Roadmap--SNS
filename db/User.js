const mongoose = require("mongoose"); // mongoose 불러오기

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
    }
});

// 모델을 export
module.exports = mongoose.model("User", UserSchema);
