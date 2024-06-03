// main.js (main.ejs를 렌더링하는 라우트 파일)
const express = require('express');
const router = express.Router();

// Main page route
router.get('/', (req, res) => {
  const user = req.session.user || "guest"; // 세션에 저장된 사용자 정보를 가져옴
  res.render('main', { user }); // main.ejs를 렌더링할 때 사용자 정보를 전달
});

module.exports = router;
