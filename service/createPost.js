const express = require('express');
const router = express.Router();
const Post = require('../db/Post'); // Post 모델 가져오기
const User = require('../db/User'); // User 모델 가져오기

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
  const authorId = req.session.user._id;
  
  if (!title || !content || !category) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  try {
    const author = await User.findById(authorId);
    if (!author) {
      return res.status(400).json({ message: '유효하지 않은 작성자입니다.' });
    }

    const newPost = new Post({
      title,
      content,
      category,
      author: author._id,
      profileImageUrl: author.profileImageUrl // User의 profileImageUrl을 저장
    });

    await newPost.save();

    // 클라이언트로 성공 메시지와 함께 메인 페이지 이동 요청
    return res.status(201).json({ message: '게시물이 작성되었습니다.', redirectTo: '/' });
    
  } catch (error) {
    console.error('게시물 작성 중 오류 발생:', error);
    return res.status(500).json({ message: '게시물 작성 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
