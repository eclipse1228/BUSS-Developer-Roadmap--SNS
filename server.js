// nodemon으로 서버 실행 : npm run server 

// 모듈 가져오기
const express = require("express");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Body-parser 설정
app.use(express.json({ extended: false }));
// 라우트 설정
app.use("/api/register", require("./routes/api/register"));

// 루트 라우트 설정
app.get("/", (req, res) => {
    res.send("API RUNNING...");
});


connectDB();
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
