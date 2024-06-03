const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');

const router = express.Router();

// Multer 설정 (파일 업로드)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type'));
    } else {
      cb(null, true);
    }
  }
});

let bucket;

// MongoDB 연결 및 GridFSBucket 초기화 함수
const initializeBucket = async (db) => {
  if (!bucket && db) {
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'pdfs' });
    console.log('GridFSBucket 초기화 성공');
  } else if (!db) {
    console.error('MongoDB 연결 실패: db 객체가 없습니다.');
  }
};

// 파일 업로드 처리 함수
const handleFileUpload = (file, res, db) => {
  if (!file) {
    return res.status(400).json({ message: '파일을 업로드 해주세요.', success: false });
  }

  if (!bucket) {
    console.error('GridFSBucket 객체가 초기화되지 않았습니다.');
    return res.status(500).json({ message: '파일 업로드 중 오류가 발생했습니다.' });
  }

  try {
    console.log('업로드 스트림 시작');
    const uploadStream = bucket.openUploadStream(file.originalname);

    uploadStream.on('finish', () => {
      console.log('파일 업로드 완료');
      res.status(200).json({ message: `파일 업로드 완료: ${file.originalname}`, success: true });
    });

    uploadStream.on('error', (err) => {
      console.error('업로드 스트림 오류:', err);
      res.status(500).json({ message: '파일 업로드 중 오류가 발생했습니다.' });
    });

    uploadStream.end(file.buffer);
  } catch (error) {
    console.error('파일 업로드 처리 중 오류 발생:', error);
    res.status(500).json({ message: '파일 업로드 처리 중 오류가 발생했습니다.' });
  }
};

// 파일 업로드 라우트
router.post('/', upload.single('pdf'), (req, res) => {
  const db = mongoose.connection.db;
  initializeBucket(db); // GridFSBucket 초기화
  handleFileUpload(req.file, res, db);
});

module.exports = router;
