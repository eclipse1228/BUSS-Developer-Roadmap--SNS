  // service/board.js
  const express = require('express');
  const router = express.Router();
  const Post = require('../db/Post'); // Post 스키마 가져오기
  const User = require('../db/User'); // Post 스키마 가져오기


  // 특정 카테고리의 게시물을 가져오는 라우터
  router.get('/:category', async (req, res) => {
    const { category } = req.params;
    try {
      const posts = await Post.find({ category }).populate('author', 'name').sort({ createdAt: -1 });
      res.render('board', { category, posts });
    } catch (error) {
      console.error('게시물 조회 중 오류 발생:', error);
      res.status(500).send('게시물 조회 중 오류가 발생했습니다.');
    }
  });


  module.exports = router;
