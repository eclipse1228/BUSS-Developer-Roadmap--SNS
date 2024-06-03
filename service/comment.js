const express = require('express');
const router = express.Router();
const Comment = require('../db/Comment');
const User = require('../db/User');
const Post = require('../db/Post');

// 댓글 생성 API 엔드포인트
router.post('/', async (req, res) => {
  try {
    const { content, authorId, postId } = req.body;
    console.log('Received request to create comment:', { content, authorId, postId });

    // 유효성 검사
    if (!content || !authorId || !postId) {
      return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }

    // 작성자와 게시물이 존재하는지 확인
    const user = await User.findById(authorId);
    const post = await Post.findById(postId);

    if (!user || !post) {
      return res.status(404).json({ message: '유효하지 않은 작성자 또는 게시물입니다.' });
    }

    // 댓글 생성
    const comment = new Comment({
      content,
      author: authorId,
      post: postId
    });

    // 데이터베이스에 저장
    await comment.save();

    console.log('Comment created successfully:', comment);
    res.status(201).json(comment);  // JSON 형식으로 응답
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ message: '서버 오류' });  // JSON 형식으로 오류 응답
  }
});

// 댓글 목록 조회 API 엔드포인트
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find().populate('author').populate('post');
    res.status(200).json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
