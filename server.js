const dotenv = require("dotenv");
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const connectDB = require("./config/db");
const addLikeRouter = require('./service/addlike');
const { getTopWriters } = require('./service/topwriter');
const Post = require('./db/Post');
const Roadmap = require('./db/Roadmap');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware 설정
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'templates')));
app.use('/static', express.static(path.join(__dirname, 'static')));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: true
}))

// connectDB 함수 호출
connectDB();

app.engine('ejs', require('ejs').__express);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

// 서비스 라우트 설정
app.use("/register", require("./service/register"));
app.use("/login", require("./service/login"));
app.use("/", require("./service/main"));
app.use("/logout", require("./service/logout"));
app.use("/editProfile", require("./service/editProfile"));
app.use("/createPost", require("./service/createPost")); // 게시물 작성 API 라우트 추가
app.use("/comments", require("./service/comment"));  // 댓글 라우트 추가
app.use('/board', require('./service/board'));
app.use('/showPost', require('./service/showPost'));
app.use('/addComment', require('./service/addComment'));
app.use('/getComments', require('./service/getComments')); 
app.use('/addLike', addLikeRouter);
app.use("/gettopwriter", require("./service/gettopwriter"));
app.use('/chat', require('./service/chat'));
app.use('/upload', require('./service/chat'));
app.use('/store-response', require('./service/chat'));
app.use('/process-pdf', require('./service/chat'));
// app.use('/profile', require('./service/public_profile'));

// app.use('/mypage',require('/servic/mypage'));
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// 댓글 테스트 페이지 라우팅
app.get("/commentTest", (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'commentTest.html'));
});

// 댓글 목록 페이지 라우팅
app.get("/commentList", (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'commentList.html'));
});

// 로그인된 사용자 정보 반환
app.get('/api/auth/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.status(200).json(req.session.user);
});

// 서버 시작
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));