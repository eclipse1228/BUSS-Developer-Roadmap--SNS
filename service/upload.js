const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');

const router = express.Router();

// Multer 설정 (파일 업로드)
const storage = multer.memoryStorage(); // 메모리에 파일 저장
const upload = multer({ 
  storage: storage, // 저장 방식 설정
  limits: { fileSize: 10 * 1024 * 1024 }, // 파일 크기 제한 (여기서는 최대 10MB)
  fileFilter: (req, file, cb) => { // 파일 필터링 함수
    const allowedMimeTypes = ['application/pdf']; // 허용할 파일 유형 (여기서는 PDF)
    if (!allowedMimeTypes.includes(file.mimetype)) { // 파일 유형이 허용된 유형인지 확인
      cb(new Error('Invalid file type')); // 허용되지 않은 유형이면 오류를 콜백으로 전달
    } else {
      cb(null, true); // 허용된 유형이면 오류 없이 계속 진행
    }
  }
});

let bucket; // GridFSBucket 객체 선언

// MongoDB 연결 및 GridFSBucket 초기화 함수
const initializeBucket = async (db) => { // MongoDB 연결 및 GridFSBucket 초기화 함수 정의
  if (!bucket && db) { // GridFSBucket 객체가 없고 db 객체가 전달된 경우
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'pdfs' }); // GridFSBucket 초기화
    console.log('GridFSBucket 초기화 성공'); // 성공 메시지 출력
  } else if (!db) { // db 객체가 없는 경우
    console.error('MongoDB 연결 실패: db 객체가 없습니다.'); // 오류 메시지 출력
  }
};

// 파일 업로드 처리 함수
const handleFileUpload = (file, res, db) => { // 파일 업로드 처리 함수 정의
  if (!file) { // 파일이 전달되지 않은 경우
    return res.status(400).json({ message: '파일을 업로드 해주세요.', success: false }); // 오류 응답 반환
  }

  if (!bucket) { // GridFSBucket 객체가 없는 경우
    console.error('GridFSBucket 객체가 초기화되지 않았습니다.'); // 오류 메시지 출력
    return res.status(500).json({ message: '파일 업로드 중 오류가 발생했습니다.' }); // 오류 응답 반환
  }

  try { // 파일 업로드 시도
    console.log('업로드 스트림 시작'); // 업로드 시작 메시지 출력
    const uploadStream = bucket.openUploadStream(file.originalname); // 업로드 스트림 열기

    uploadStream.on('finish', () => { // 업로드 완료 이벤트 핸들러
      console.log('파일 업로드 완료'); // 업로드 완료 메시지 출력
      res.status(200).json({ message: `파일 업로드 완료: ${file.originalname}`, success: true }); // 성공 응답 반환
    });

    uploadStream.on('error', (err) => { // 업로드 오류 이벤트 핸들러
      console.error('업로드 스트림 오류:', err); // 오류 메시지 출력
      res.status(500).json({ message: '파일 업로드 중 오류가 발생했습니다.' }); // 오류 응답 반환
    });

    uploadStream.end(file.buffer); // 파일 버퍼를 업로드 스트림에 쓰기
  } catch (error) { // 오류 발생 시
    console.error('파일 업로드 처리 중 오류 발생:', error); // 오류 메시지 출력
    res.status(500).json({ message: '파일 업로드 처리 중 오류가 발생했습니다.' }); // 오류 응답 반환
  }
};

// 파일 업로드 라우트
router.post('/', upload.single('pdf'), (req, res) => { // 파일 업로드 라우트 정의
  const db = mongoose.connection.db; // 현재 MongoDB 연결 객체
  initializeBucket(db); // GridFSBucket 초기화
  handleFileUpload(req.file, res, db); // 파일 업로드 처리
});

module.exports = router; // 라우터 내보내기
