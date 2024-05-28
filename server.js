// 모듈 가져오기
const express = require("express");
const path = require("path");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Body-parser 설정
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: false })); // 폼 데이터 파싱

// EJS를 뷰 엔진으로 등록
app.engine('ejs', require('ejs').__express);

// 뷰 엔진 설정
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

// 라우트 설정
app.use("/register", require("./services/register"));
app.use("/login", require("./services/login"));
app.use('/upload', require('./services/upload'));
// 루트 라우트 설정
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});
app.get('/upload', (req, res) => {
    res.render('upload');
});

connectDB();
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
