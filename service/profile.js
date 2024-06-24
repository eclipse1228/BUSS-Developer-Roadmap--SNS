const express = require("express");
const axios = require("axios");
const User = require("../db/User");
const Post = require("../db/Post");
const path = require('path');
const router = express.Router();
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use('/static', express.static(path.join(__dirname, 'static')));

const mongoUrl = "mongodb://127.0.0.1:27017";
const dbName = 'test';


// 프로필 수정 페이지 렌더링
router.get("/", async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect("/login");
  }

  try {
    let mentorName = "";
    let menteeName = "";

    if (user.mentor) {
      const mentor = await User.findOne({ id: user.mentor });
      console.log("Mentor:", mentor); // 로그 추가
      mentorName = mentor ? mentor.name : "";
    }

    if (user.mentee) {
      const mentee = await User.findOne({ id: user.mentee });
      console.log("Mentee:", mentee); // 로그 추가
      menteeName = mentee ? mentee.name : "";
    }

    res.render("profile", { user, mentorName, menteeName });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(dbName);
    const roadmapCollection = db.collection('Roadmap');

 const latestRoadmap = await roadmapCollection.findOne(
      { userId: user.id },
      { sort: { _id: -1 } }
    );
    console.log("User ID:", user.id);
    console.log("Fetched roadmap:", latestRoadmap);
    await client.close();

    res.render("profile", { user, roadmap: latestRoadmap ? latestRoadmap.roadmap : null });
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    // res.render("profile", { user, roadmap: null });
    res.status(500).render("error", { message: "Failed to fetch roadmap data" });
  }

});

// 사용자 프로필 수정 요청 처리
router.post("/", async (req, res) => {
  const { id, name, age, email, job, githubUsername } = req.body;

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

    if (githubUsername && githubUsername !== user.githubUsername) {
      user.githubUsername = githubUsername; 
      isUpdated = true;      // GitHub API를 사용하여 프로필 이미지 URL 가져오기
      const response = await axios.get(`https://api.github.com/users/${githubUsername}`);
      user.profileImageUrl = response.data.avatar_url;

      // 해당 사용자의 모든 게시글 업데이트
      await Post.updateMany(
        { author: user._id },
        { profileImageUrl: user.profileImageUrl }
      );
    }

    if (isUpdated) {
      await user.save();
      // 세션 데이터 업데이트
      req.session.user = user;
      return res.json({ success: true, message: "변경사항이 저장되었습니다." });
    } else {
      return res.json({ success: false, message: "변경사항이 없습니다." });
    }
  } 
  
  catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;


