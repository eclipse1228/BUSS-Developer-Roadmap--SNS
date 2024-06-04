const express = require('express');
const mongoose = require('mongoose');
const User = require('./db/User'); // User 모델을 가져옵니다
require('dotenv').config(); // .env 파일의 환경 변수를 로드합니다

const app = express();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/user-info-app';
const PORT = process.env.PORT || 3000;

// MongoDB 연결
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}).then(() => {
    console.log('MongoDB 연결 성공');
}).catch((err) => {
    console.error('MongoDB 연결 오류:', err);
});

// EJS 설정
app.set('view engine', 'ejs');
app.set('views', './views');

// 메인 페이지 라우트 - 직업별 필터링
app.get('/', async (req, res) => {
    try {
        const jobFilter = req.query.job || ''; // 쿼리 파라미터로 직업 필터링
        let users;
        if (jobFilter) {
            users = await User.find({ job: jobFilter }).sort('name');
        } else {
            users = await User.find().sort('job');
        }
        const jobs = await User.distinct('job'); // 존재하는 모든 직업 목록을 가져옴
        res.render('index', { users, jobs, selectedJob: jobFilter });
    } catch (err) {
        res.status(500).send('서버 오류');
    }
});

app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});
