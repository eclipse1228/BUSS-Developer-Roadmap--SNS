// 모듈 가져오기
const express = require("express"); 
const User = require("../models/User"); // User model 불러오기
const bcrypt = require("bcryptjs");        // 암호화 모듈

// 라우터 생성
const router = express.Router(); 

// POST 요청 처리
router.post("/",  async (req, res) => {

  // 요청 본문에서 데이터 추출
  const { id, pw, name, age } = req.body; 

    try {
      // id 중복 검사
      let user = await User.findOne({ id });
			if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "ID already exists" }] });
      }
			
      // User 객체 생성
      user = new User({
        id,
        pw,
        name,
        age
      });

      // 비밀번호 암호화
      const salt = await bcrypt.genSalt(10);
      user.pw = await bcrypt.hash(pw, salt);

      // 생성한 User 객체를 DB에 저장  
      await user.save(); 

      res.send("Success");
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router; // export