const express = require('express');
const router = express.Router();

// mentoring room 페이지 렌더링
router.get('/', (req, res) => {
  // 사용자 정보 및 세션에서 데이터 가져오기
  const user = req.session.user;
  const mentorId = req.query.mentorId;
  const menteeId = req.query.menteeId;

  // mentoring room 페이지 렌더링
  res.render('mentoringRoom', { user, mentorId, menteeId });
});

module.exports = router;
