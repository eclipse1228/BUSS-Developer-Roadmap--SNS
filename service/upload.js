const express = require('express');
const multer = require('multer');
const path = require('path');
const OpenAI = require('openai');
const fs = require('fs');
const pdf = require('pdf-parse');

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Multer 설정 (파일 업로드를 위한 미들웨어)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // 파일 업로드 경로
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // 원본 파일 이름 사용
  }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', req.file.originalname);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(fileBuffer);

    const prompt = `Here is the content of the PDF file:\n\n${pdfData.text}\n\nPlease provide a detailed response based on the provided content.`;

    const response = await client.completions.create({
      model: 'text-davinci-003', // 적절한 모델 선택
      prompt: prompt,
      max_tokens: 1500 // 필요에 따라 조정
    });

    res.status(200).json({ message: 'File uploaded and processed successfully', response: response.choices[0].text });
  } catch (error) {
    console.error("Error during file upload and processing:", error);
    res.status(500).json({ message: 'Error during file upload and processing' });
  }
});

module.exports = router;
