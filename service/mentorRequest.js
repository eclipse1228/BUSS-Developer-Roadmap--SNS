const express = require('express');
const router = express.Router();
const User = require('../db/User'); // 유저 모델 불러오기

router.post('/mentor-request', async (req, res) => {
  // 현재 로그인된 사용자의 이름을 세션에서 가져옴
  const loggedInUserName = req.session.user?.name;
  
  if (!loggedInUserName) {
    console.log('Not authenticated'); // 인증되지 않음 로그 출력
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  const { userName } = req.body;
  console.log('Received request:', { userName }); // 요청 데이터 로그 출력
  
  if (loggedInUserName === userName) {
    console.log('Cannot request mentorship to oneself'); // 자기 자신에게 멘토 신청 금지 로그 출력
    return res.status(400).json({ success: false, message: 'Cannot request mentorship to oneself' });
  }

  try {
    const mentor = await User.findOne({ name: userName });
    if (!mentor) {
      console.log('User not found'); // 사용자 찾지 못함 로그 출력
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 이미 신청한 경우 확인
    if (mentor.menteeRequests.includes(loggedInUserName)) {
      console.log('Already requested'); // 이미 신청한 경우 로그 출력
      return res.status(400).json({ success: false, message: 'Already requested' });
    }

    // 기존 멘티와 멘토의 관계 초기화
    if (mentor.mentee) {
      const existingMentee = await User.findOne({ name: mentor.mentee });
      if (existingMentee) {
        existingMentee.mentor = null;
        await existingMentee.save();
      }
    }

    console.log('Adding mentee request from:', loggedInUserName);
    mentor.menteeRequests.push(loggedInUserName);
    await mentor.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/accept', async (req, res) => {
  const { menteeName } = req.body;
  const userName = req.session.user?.name;
  if (!userName) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const mentor = await User.findOne({ name: userName });
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const mentee = await User.findOne({ name: menteeName });
    if (!mentee) {
      return res.status(404).json({ success: false, message: 'Mentee not found' });
    }

    // 기존 멘티와 멘토의 관계 초기화
    if (mentor.mentee) {
      const existingMentee = await User.findOne({ name: mentor.mentee });
      if (existingMentee) {
        existingMentee.mentor = null;
        await existingMentee.save();
      }
    }
    if (mentee.mentor) {
      const existingMentor = await User.findOne({ name: mentee.mentor });
      if (existingMentor) {
        existingMentor.mentee = null;
        await existingMentor.save();
      }
    }

    mentor.mentee = mentee.name;
    mentee.mentor = mentor.name;
    mentor.menteeRequests = mentor.menteeRequests.filter(request => request !== menteeName);

    await mentor.save();
    await mentee.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/reject', async (req, res) => {
  const { menteeName } = req.body;
  const userName = req.session.user?.name;
  if (!userName) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  try {
    const mentor = await User.findOne({ name: userName });
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    mentor.menteeRequests = mentor.menteeRequests.filter(request => request !== menteeName);
    await mentor.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
