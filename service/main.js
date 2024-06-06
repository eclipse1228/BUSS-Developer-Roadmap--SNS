const express = require('express');
const router = express.Router();
const Post = require('../db/Post');
const User = require('../db/User');
const { getTopWriters } = require('./topwriter');

// 카테고리별 최신 포스트 5개 가져오기
router.get('/', async (req, res) => {
  try {
    // user 정보 추가
    const user = req.session.user || { id: 'guest' };

    // top writer 정보 추가
    const topwriters = await getTopWriters();

    // 카테고리 별로 게시물 최신순 5개 
    const communityPosts = await Post.find({ category: 'community' })
      .sort({ createdAt: -1 })
      .populate('author', 'name')
      .populate('comments')
      .limit(5);
    
    const frontendPosts = await Post.find({ category: 'frontend' })
      .sort({ createdAt: -1 })
      .populate('author', 'name')
      .populate('comments')
      .limit(5);
    
    const backendPosts = await Post.find({ category: 'backend' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'name')
      .populate('comments');

    // WeeklyBestPosts
    const now = new Date();
    const weeklyBestPosts = await Post.find({ createdAt: {$gte: new Date(now.setDate(now.getDate() - 7))} })
    .sort({ likes: -1 }) // 좋아요 순으로 정렬
    .limit(5)
    .populate('author', 'name')
    .populate('comments');
    
    res.render('main', { 
      communityPosts, 
      frontendPosts, 
      backendPosts,
      weeklyBestPosts,
      topwriters,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
});

module.exports = router;
