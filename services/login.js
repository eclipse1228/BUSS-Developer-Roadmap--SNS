// 모듈 가져오기
const express = require("express");
const User = require("../db/User"); // User model 불러오기
const bcrypt = require("bcryptjs"); // 암호화 모듈

// 라우터 생성
const router = express.Router();

// POST 요청 처리
router.post("/", async (req, res) => {
  // 요청 본문에서 데이터 추출
  const { id, pw } = req.body;

  try {
    // 사용자 확인
    let user = await User.findOne({ id });
    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Invalid ID or Password" }] });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(pw, user.pw);
    if (!isMatch) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Invalid ID or Password" }] });
    }

    res.send("Login Successful");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
