const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000; // 환경 변수에서 포트 번호를 가져오고, 없으면 기본값 3000 사용
const SECRET_KEY = 'your_secret_key';

app.use(bodyParser.json());

const users = [
    { username: 'admin', password: 'password123' }
];

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).send('로그인 실패');
    }
});

app.get('/admin', (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).send('토큰이 필요합니다.');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.json({ message: '접근 허용', user: decoded });
    } catch (err) {
        res.status(403).send('접근이 거부되었습니다.');
    }
});

app.listen(PORT);
