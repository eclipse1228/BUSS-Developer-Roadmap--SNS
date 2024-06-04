// service/addComment.js

const express = require('express');
const router = express.Router();
const Comment = require('../db/Comment');
const Post = require('../db/Post');
const User = require('../db/User');

// 댓글 추가 엔드포인트
router.post('/', async (req, res) => {
  try {
    // 클라이언트로부터 받은 데이터 추출
    const { content, post } = req.body;

    // 새로운 댓글 생성
    const newComment = new Comment({
      content: content,
      author: req.session.user._id, // 현재 로그인된 사용자의 ID를 사용
      post: post
    });

    // 댓글 저장
    await newComment.save();

    res.status(200).json({ success: true, message: '댓글이 성공적으로 추가되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});


module.exports = router;
