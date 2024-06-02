const express = require('express');
const multer = require('multer');
const { MongoClient, GridFSBucket } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

const mongoURI = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

if (!mongoURI) {
    console.error('MONGO_URI가 정의되지 않았습니다. .env 파일을 확인해주세요.');
    process.exit(1);
}

if (!dbName) {
    console.error('DB_NAME이 정의되지 않았습니다. .env 파일을 확인해주세요.');
    process.exit(1);
}

console.log(`Connecting to MongoDB at ${mongoURI} and database ${dbName}`);

let bucket;

const connectToMongoDB = async () => {
    try {
        const client = await MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db(dbName);
        console.log(`Connected to database: ${db.databaseName}`);
        bucket = new GridFSBucket(db, { bucketName: 'pdfs' });
        console.log('GridFSBucket 초기화 성공');
    } catch (err) {
        console.error('MongoDB 연결 실패:', err);
        process.exit(1);
    }
};

connectToMongoDB();

// Multer 설정 (파일 업로드)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 파일 크기 제한 (예: 50MB)
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('PDF 파일만 업로드 가능합니다.'));
        }
        cb(null, true);
    }
});

router.post('/', upload.single('pdf'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ message: '파일을 업로드 해주세요.', success: false });
    }

    if (!bucket) {
        console.error('GridFSBucket 객체가 초기화되지 않았습니다. bucket:', bucket);
        return res.status(500).json({ message: '파일 업로드 중 오류가 발생했습니다.' });
    }

    try {
        console.log('업로드 스트림 시작');
        const uploadStream = bucket.openUploadStream(file.originalname);
        uploadStream.end(file.buffer);

        uploadStream.on('finish', () => {
            console.log('파일 업로드 완료');
            res.status(200).json({ message: `파일 업로드 완료: ${file.originalname}`, success: true });
        });

        uploadStream.on('error', (err) => {
            console.error('업로드 스트림 오류:', err);
            res.status(500).json({ message: '파일 업로드 중 오류가 발생했습니다.' });
        });
    } catch (error) {
        console.error('파일 업로드 처리 중 오류 발생:', error);
        res.status(500).json({ message: '파일 업로드 처리 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
