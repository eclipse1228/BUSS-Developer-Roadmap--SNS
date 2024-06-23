const express = require('express');
const router = express.Router();
const User = require('../db/User'); // 유저 모델 불러오기

// 멘토링 페이지 렌더링
router.get('/', async (req, res) => {
    const userName = req.session.user?.name;
    if (!userName) {
        return res.redirect('/login');
    }

    const user = await User.findOne({ name: userName }).populate('menteeRequests');
    if (!user) {
        return res.status(404).send('User not found');
    }

    res.render('mentoring', { user });
});

// 멘토링 요청 수락
router.post('/accept', async (req, res) => {
    const { menteeName } = req.body;
    const userName = req.session.user?.name;
    if (!userName) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    try {
        const user = await User.findOne({ name: userName });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const mentee = await User.findOne({ name: menteeName });
        if (!mentee) {
            return res.status(404).json({ success: false, message: 'Mentee not found' });
        }

        user.mentee = mentee.name;
        mentee.mentor = user.name;
        user.menteeRequests = user.menteeRequests.filter(request => request !== menteeName);

        await user.save();
        await mentee.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 멘토링 요청 거부
router.post('/reject', async (req, res) => {
    const { menteeName } = req.body;
    const userName = req.session.user?.name;
    if (!userName) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    try {
        const user = await User.findOne({ name: userName });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.menteeRequests = user.menteeRequests.filter(request => request !== menteeName);
        await user.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
