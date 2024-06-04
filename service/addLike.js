const express = require('express');
const router = express.Router();
const Post = require('../db/Post'); // Post 모델 경로를 적절히 수정

// 좋아요 추가 라우트
router.post('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (post) {
      post.likes += 1;
      await post.save();
      res.json({ success: true, likes: post.likes });
    } else {
      res.json({ success: false, message: 'Post not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
