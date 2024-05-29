const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer 설정 (파일 업로드)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// PDF 파일 업로드 처리 라우트
router.post('/', upload.single('pdf'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.render('upload', { message: '파일을 업로드 해주세요.', success: false });
    }
    res.render('upload', { message: `파일 업로드 완료: ${file.filename}`, success: true });
});

module.exports = router;
