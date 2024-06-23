const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./db/User'); // 유저 모델 추가

// 라우터 추가
const mentorRequestRouter = require('./service/mentorRequest');
const mentoringRouter = require('./service/mentoring');

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// connectDB 함수 호출
connectDB();

// EJS 설정
app.engine('ejs', require('ejs').__express);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

// 로그인된 사용자 정보를 모든 EJS 템플릿에 전달
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

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
app.use('/addLike', require('./service/addlike'));
app.use("/gettopwriter", require("./service/gettopwriter"));
app.use('/chat', require('./service/chat'));
app.use('/upload', require('./service/chat'));
app.use('/store-response', require('./service/chat'));
app.use('/process-pdf', require('./service/chat'));
app.use('/updateRoadmap', require('./service/chat')); // roadmap 업데이트 
app.use('/searchPost', require('./service/searchPost'));
app.use('/profile', require('./service/profile'));
app.use('/mentoringChat', require('./service/mentoringChat'));
app.use('/mentor', mentorRequestRouter); 
app.use('/mentoring', mentoringRouter); // 멘토링 라우트 사용

// 로그인 페이지 라우팅
app.get("/login", (req, res) => {
  res.render("login");
});

// 회원가입 페이지 라우팅
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

// 로그인된 사용자 정보 반환 API
app.get('/api/auth/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.status(200).json(req.session.user);
});

// 프로필 검색 라우팅 추가
app.get('/searchprofile/name/:name', async (req, res) => {
  try {
    const user = await User.findOne({ name: req.params.name });
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.render('userProfile', { user });
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// 서버 시작
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));