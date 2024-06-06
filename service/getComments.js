const express = require('express');
const router = express.Router();
const Comment = require('../db/Comment');
const User = require('../db/User');

router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId }).populate('author', 'name').exec();

    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
