const express = require('express');
const router = express.Router();
const MentoringChat = require('../db/MentoringChat');
const User = require('../db/User');

router.post('/startChat', async (req, res) => {
    const { mentorId, menteeId } = req.body;
    const roomId = `${mentorId}_${menteeId}`;
    res.status(200).json({ roomId });
});

router.get('/startChat', async (req, res) => {
    const { mentorId, menteeId } = req.query;
    const roomId = `${mentorId}_${menteeId}`;
    res.render('mentoringChat', { roomId });
});

router.get('/messages/:roomId', async (req, res) => {
    const { roomId } = req.params;
    const messages = await MentoringChat.find({ roomId }).populate('sender');
    res.status(200).json(messages);
});

module.exports = router;