const express = require('express');
const router = express.Router();
const Post = require('../db/Post');

// 카테고리별 최신 포스트 5개 가져오기
router.get('/', async (req, res) => {
  try {
    const communityPosts = await Post.find({ category: 'community' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'id')
      .populate('comments');
    
    const frontendPosts = await Post.find({ category: 'frontend' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'id')
      .populate('comments');
    
    const backendPosts = await Post.find({ category: 'backend' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'id')
      .populate('comments');

    // user 정보 추가
    const user = req.session.user || { id: 'guest' };

    res.render('main', { 
      communityPosts, 
      frontendPosts, 
      backendPosts,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('서버 오류가 발생했습니다.');
  }
});

module.exports = router;
