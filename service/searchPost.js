// service/searchPost.js
const express = require('express');
const router = express.Router();
const Post = require('../db/Post'); // Post 스키마 가져오기

// 검색 결과를 가져오는 라우터
router.get('/', async (req, res) => {
  const { query } = req.query;
  try {
    const posts = await Post.find({ title: { $regex: query, $options: 'i' } }).populate('author', 'name').sort({ createdAt: -1 });

    const user = req.session.user || { id: 'guest' };

    res.render('board', { category: '검색 결과', posts, user, query });
  } catch (error) {
    console.error('게시물 검색 중 오류 발생:', error);
    res.status(500).send('게시물 검색 중 오류가 발생했습니다.');
  }
});

module.exports = router;
