const express = require("express");
const router = express.Router();

// 메인 페이지 라우트
router.get("/", (req, res) => {
  if (req.session.user) {
    res.render("main", { user: req.session.user });
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
