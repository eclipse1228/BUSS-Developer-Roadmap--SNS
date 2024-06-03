// service/createPost.js
const express = require('express');
const router = express.Router();
const Post = require('../db/Post'); // Post 모델 가져오기

// 게시물 작성 페이지 렌더링
router.get('/', (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.redirect('/login');
  }
  res.render('createPost', { user });
});

// 게시물 작성 API
router.post('/', async (req, res) => {
  const { title, content, category } = req.body;
  const author = req.session.user._id;

  if (!title || !content || !category) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  try {
    const newPost = new Post({
      title,
      content,
      category,
      author
    });

    await newPost.save();

    // 클라이언트로 성공 메시지와 함께 메인 페이지 이동 요청
    res.status(201).json({ message: '게시물이 작성되었습니다.', redirectTo: '/' });
  } catch (error) {
    console.error('게시물 작성 중 오류 발생:', error);
    res.status(500).json({ message: '게시물 작성 중 오류가 발생했습니다.' });
  }
});

module.exports = router;