const express = require("express");
const User = require("../db/User");
const bcrypt = require("bcryptjs");

const router = express.Router();

router.post("/", async (req, res) => {
  const { id, pw, name, age, email, job } = req.body;

  try {
    let user = await User.findOne({ id });
    if (user) {
      return res.status(400).json({ errors: [{ msg: "이미 존재하는 ID 입니다." }] });
    }

    user = new User({
      id,
      pw,
      name,
      age,
      email,
      job
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
