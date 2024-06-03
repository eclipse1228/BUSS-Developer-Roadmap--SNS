const mongoose = require("mongoose"); // mongoose 불러오기

const RoadmapSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roadmapFile: {
        type: String, // json 형태가 들어갑니다.
        required: false
    }
});

// 모델을 export
module.exports = mongoose.model("Roadmap", RoadmapSchema);
