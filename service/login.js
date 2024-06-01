const express = require("express");
const User = require("../db/User"); // User model 불러오기
const bcrypt = require("bcryptjs"); // 암호화 모듈
const session = require("express-session"); // 세션 관리 모듈

// 라우터 생성
const router = express.Router();

// 세션 설정 (애플리케이션의 상위 모듈에서 설정해야 함)
router.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true
}));

// 로그인 요청 처리
router.post("/", async (req, res) => {
  const { id, pw } = req.body;

  try {
    // 사용자 확인
    let user = await User.findOne({ id });
    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid ID or Password" }] });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(pw, user.pw);
    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: "Invalid ID or Password" }] });
    }

    // 세션에 사용자 정보 저장
    req.session.user = user;

    // 팝업으로 사용자 이름 출력 후 메인 페이지로 리디렉션
    res.send(`<script>alert("${user.id}님 반갑습니다"); window.location.href = '/';</script>`);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
