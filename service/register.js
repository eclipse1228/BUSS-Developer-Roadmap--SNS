const express = require("express");
const User = require("../db/User");
const bcrypt = require("bcryptjs");
const fetch = require("node-fetch");

const router = express.Router();

router.post("/", async (req, res) => {
  const { id, pw, name, age, email, job, githubUsername } = req.body;

  try {
    let user = await User.findOne({ id });
    if (user) {
      return res.status(400).json({ errors: [{ msg: "이미 존재하는 ID 입니다." }] });
    }

    let profileImageUrl = '/static/usericon.png'; // 기본 프로필 이미지 설정

    if (githubUsername) {
      try {
        const response = await fetch(`https://api.github.com/users/${githubUsername}`);
        if (response.ok) {
          const githubData = await response.json();
          profileImageUrl = githubData.avatar_url;
        } else {
          return res.status(400).json({ errors: [{ msg: "Invalid GitHub username" }] });
        }
      } catch (error) {
        console.error("GitHub 사용자 정보를 가져오는 중 오류 발생:", error);
        return res.status(500).json({ errors: [{ msg: "GitHub 사용자 정보를 가져오는 중 오류가 발생했습니다." }] });
      }
    }

    user = new User({
      id,
      pw,
      name,
      age,
      email,
      job,
      githubUsername,
      profileImageUrl
    });

    const salt = await bcrypt.genSalt(10);
    user.pw = await bcrypt.hash(pw, salt);

    await user.save();

    res.send("Success");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
