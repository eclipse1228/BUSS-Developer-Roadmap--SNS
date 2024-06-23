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
  
  try {
    const user = await User.findOne({ name: userName });
    if (!user) {
      console.log('User not found'); // 사용자 찾지 못함 로그 출력
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('Adding mentee request from:', loggedInUserName);
    user.menteeRequests.push(loggedInUserName);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
