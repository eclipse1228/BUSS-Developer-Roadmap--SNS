const express = require("express");
const MentoringChat = require("../db/MentoringChat");
const User = require("../db/User");
const router = express.Router();

router.get("/", async (req, res) => {
    const { mentorId, menteeId } = req.query;

    if (!mentorId || !menteeId) {
        return res.status(400).send("Invalid request");
    }

    try {
        const chat = await MentoringChat.findOne({ mentorId, menteeId });
        const mentor = await User.findOne({ id: mentorId });
        const mentee = await User.findOne({ id: menteeId });
        const user = req.session.user || { id: 'guest' };

        res.render("mentoringChat", { chat, mentor, mentee, user });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
});

router.post("/sendMessage", async (req, res) => {
    const { mentorId, menteeId, senderId, message } = req.body;

    if (!mentorId || !menteeId || !senderId || !message) {
        return res.status(400).json({ success: false, message: "Invalid request" });
    }

    try {
        let chat = await MentoringChat.findOne({ mentorId, menteeId });

        if (!chat) {
            chat = new MentoringChat({ mentorId, menteeId, messages: [] });
        }

        chat.messages.push({ sender: senderId, message });
        await chat.save();

        res.json({ success: true, message: "Message sent" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;