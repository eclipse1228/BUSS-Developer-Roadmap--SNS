// server.js
// nodemon으로 서버 실행 : npm run server 
// 모듈 가져오기
const dotenv = require("dotenv");
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const { MongoClient, GridFSBucket } = require('mongodb');
const connectDB = require("./config/db");

dotenv.config();

const app = express();
// const router = express.Router();

const PORT = process.env.PORT || 5000;

// Middleware 설정
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'templates')));
app.use('/static', express.static(path.join(__dirname, 'static')));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: true
}));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let assistant;

(async () => {
  try {
    assistant = await client.beta.assistants.create({
      instructions: "You are a career counselor for computer science students. You receive a student's self-introduction letter, and suggest advice and a career roadmap.",
      name: "career counselor",
      tools: [{ type: "file_search" }],
      model: "gpt-4-turbo",
    });

    console.log("Assistant created:", assistant);

    const filePath = path.join(__dirname, 'static', 'backend_java.json');
    const file = [filePath].map((filePath) => fs.createReadStream(filePath));

    let vectorStore = await client.beta.vectorStores.create({
      name: "RoadMap",
      expires_after: { "anchor": "last_active_at", "days": 1 }
    });

    await client.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
      files: file,
    });

    await client.beta.assistants.update(assistant.id, {
      tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
    });

    console.log("Vector store created and files uploaded");
  } catch (error) {
    console.error("Error during initialization:", error);
  }
})();

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'chat.html'));
});

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    const thread = await client.beta.threads.create({
      messages: [{ role: "user", content: prompt }],
    });

    const stream = client.beta.threads.runs
      .stream(thread.id, { assistant_id: assistant.id })
      .on("textCreated", () => console.log("assistant >"))
      .on("toolCallCreated", (event) => console.log("assistant " + event.type))
      .on("messageDone", async (event) => {
        if (event.content[0].type === "text") {
          const { text } = event.content[0];
          const { annotations } = text;
          const citations = [];

          let index = 0;
          for (let annotation of annotations) {
            text.value = text.value.replace(annotation.text, "[" + index + "]");
            const { file_citation } = annotation;
            if (file_citation) {
              const citedFile = await client.files.retrieve(file_citation.file_id);
              citations.push("[" + index + "]" + citedFile.filename);
            }
            index++;
          }

          console.log(text.value);
          console.log(citations.join("\n"));

          res.status(200).send({ bot: text.value });
        }
      });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

connectDB();
console.log("try .. ")

// EJS를 뷰 엔진으로 등록

app.engine('ejs', require('ejs').__express);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

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

// MongoDB 연결 설정
const mongoURI = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

let bucket;

app.post('/upload', upload.single('pdf'), (req, res) => {
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

app.use("/register", require("./service/register"));
app.use("/login", require("./service/login"));
app.use("/roadmap", require("./service/roadmap"));  // 로드맵 페이지 라우트 추가.
app.use("/", require("./service/main"));
app.use("/logout", require("./service/logout"));
app.use("/editProfile", require("./service/editProfile"));
app.use("/createPost", require("./service/createPost")); 
app.use('/board', require('./service/board'));
app.use('/showPost', require('./service/showPost'));
app.use('/addComment', require('./service/addComment'));



app.get("/", (req, res) => {
  const user = req.session.user || "guest";
  res.render("main", { user });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/post", (req,res)=> {
  res.render("post");
})

app.get('/upload', (req, res) => {
  res.render('upload');
});

app.get('/roadmap', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates/roadmap.html'));
});

app.get('/roadmap2',(req,res)=> {
  res.sendFile(path.join(__dirname, 'templates/roadmap2.html'));
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
