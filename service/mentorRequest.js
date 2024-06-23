const express = require('express');
const router = express.Router();
const User = require('../db/User'); // 유저 모델 불러오기

router.post('/mentor-request', async (req, res) => {
  // 현재 로그인된 사용자의 이름을 세션에서 가져옴
  const loggedInUser = req.session.user?.id;
  
  if (!loggedInUser) {
    console.log('Not authenticated'); // 인증되지 않음 로그 출력
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  const { userId } = req.body;
  console.log('Received request:', { userId }); // 요청 데이터 로그 출력
  
  if (loggedInUser === userId) {
    console.log('Cannot request mentorship to oneself'); // 자기 자신에게 멘토 신청 금지 로그 출력
    return res.status(400).json({ success: false, message: 'Cannot request mentorship to oneself' });
  }

  try {
    const mentor = await User.findOne({ id: userId });
    if (!mentor) {
      console.log('User not found'); // 사용자 찾지 못함 로그 출력
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 이미 신청한 경우 확인
    if (mentor.menteeRequests.includes(loggedInUser)) {
      console.log('Already requested'); // 이미 신청한 경우 로그 출력
      return res.status(400).json({ success: false, message: 'Already requested' });
    }

    // 기존 멘티와 멘토의 관계 초기화
    if (mentor.mentee) {
      const existingMentee = await User.findOne({ id: mentor.mentee });
      if (existingMentee) {
        existingMentee.mentor = null;
        await existingMentee.save();
      }
    }

    console.log('Adding mentee request from:', loggedInUser);
    mentor.menteeRequests.push(loggedInUser);
    await mentor.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/accept', async (req, res) => {
  const { menteeId } = req.body;
  const userId = req.session.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const mentor = await User.findOne({ id: userId });
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const mentee = await User.findOne({ id: menteeId });
    if (!mentee) {
      return res.status(404).json({ success: false, message: 'Mentee not found' });
    }

    // 기존 멘티와 멘토의 관계 초기화
    if (mentor.mentee) {
      const existingMentee = await User.findOne({ id: mentor.mentee });
      if (existingMentee) {
        existingMentee.mentor = null;
        await existingMentee.save();
      }
    }
    if (mentee.mentor) {
      const existingMentor = await User.findOne({ id: mentee.mentor });
      if (existingMentor) {
        existingMentor.mentee = null;
        await existingMentor.save();
      }
    }

    mentor.mentee = mentee.id;
    mentee.mentor = mentor.id;
    mentor.menteeRequests = mentor.menteeRequests.filter(request => request !== menteeId);

    await mentor.save();
    await mentee.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/reject', async (req, res) => {
  const { menteeId } = req.body;
  const userId = req.session.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const mentor = await User.findOne({ id: userId });
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    mentor.menteeRequests = mentor.menteeRequests.filter(request => request !== menteeId);
    await mentor.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
