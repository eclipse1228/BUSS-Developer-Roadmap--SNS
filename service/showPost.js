const express = require('express');
const router = express.Router();
const Post = require('../db/Post'); // Post 모델 가져오기
const Comment = require('../db/Comment'); // Comment 모델 가져오기

// 게시물 상세 보기 라우트
router.get('/:id', async (req, res) => {
  try {
    const user = req.session.user || { id: 'guest' };
    
    const post = await Post.findById(req.params.id).populate('author').populate('comments');
    if (!post) {
      return res.status(404).json({ message: '게시물을 찾을 수 없습니다.' });
    }
    res.render('showPost', { post, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
