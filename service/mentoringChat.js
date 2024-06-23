const express = require('express');
const router = express.Router();
const MentoringChat = require('../db/MentoringChat');
const User = require('../db/User');

// 채팅 시작
router.post('/startChat', async (req, res) => {
    const { mentorId, menteeId } = req.body;
    const roomId = `${mentorId}_${menteeId}`;
    res.status(200).json({ roomId });
});

// 채팅 시작 페이지 렌더링
router.get('/startChat', async (req, res) => {
    const { mentorId, menteeId } = req.query;
    const roomId = `${mentorId}_${menteeId}`;
    res.render('mentoringChat', { roomId, user: req.session.user });
});

// 채팅 메시지 가져오기
router.get('/messages/:roomId', async (req, res) => {
    const { roomId } = req.params;
    const messages = await MentoringChat.find({ roomId }).populate('sender');
    res.status(200).json(messages);
});

// 채팅 메시지 보내기
router.post('/messages/:roomId', async (req, res) => {
    const { roomId } = req.params;
    const { message } = req.body;
    const sender = req.session.user._id;

    const newMessage = new MentoringChat({
        roomId,
        sender,
        message,
    });

    await newMessage.save();

    res.status(200).json(newMessage);
});

module.exports = router;
