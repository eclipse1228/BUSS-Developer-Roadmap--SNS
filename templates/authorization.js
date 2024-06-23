const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // User 모델을 가져옵니다.

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/your_database', { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ id: username });
        if (user && await bcrypt.compare(password, user.pw)) {
            const token = jwt.sign({ username: user.id }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).send('로그인 실패');
        }
    } catch (err) {
        res.status(500).send('서버 오류');
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

app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).send('서버 오류');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
