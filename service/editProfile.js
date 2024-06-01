const express = require("express");
const User = require("../db/User");
const router = express.Router();

// 프로필 수정 페이지 렌더링
router.get("/", (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect("/login"); // 로그인되지 않은 경우 로그인 페이지로 리디렉션
  }
  res.render("editProfile", { user });
});

// 사용자 프로필 수정 요청 처리
router.post("/", async (req, res) => {
  const { id, name, age, email, job } = req.body;

  try {
    // 사용자 확인
    let user = await User.findOne({ id });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // 필드 업데이트
    let isUpdated = false;
    if (name && name !== user.name) { user.name = name; isUpdated = true; }
    if (age && age !== user.age) { user.age = age; isUpdated = true; }
    if (email && email !== user.email) { user.email = email; isUpdated = true; }
    if (job && job !== user.job) { user.job = job; isUpdated = true; }

    if (isUpdated) {
      await user.save();
      return res.json({ success: true, message: "Profile updated successfully" });
    } else {
      return res.json({ success: false, message: "No changes to update" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
