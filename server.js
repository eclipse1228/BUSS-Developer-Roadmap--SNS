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
const morgan = require('morgan');
const winston = require('./config/winston');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware 설정
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'templates')));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: true
}));

// OpenAI 클라이언트 설정
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





// connectDB 함수 호출
connectDB();

app.engine('ejs', require('ejs').__express);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "templates"));

// Multer 설정 (파일 업로드)

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

// 서비스 라우트 설정
app.use("/register", require("./service/register"));
app.use("/login", require("./service/login"));
app.use("/", require("./service/main"));
app.use("/logout", require("./service/logout"));
app.use("/editProfile", require("./service/editProfile"));
app.use("/createPost", require("./service/createPost")); // 게시물 작성 API 라우트 추가
app.use("/comments", require("./service/comment"));  // 댓글 라우트 추가
app.use('/board', require('./service/board'));
app.use('/showPost', require('./service/showPost'));
app.use('/addComment', require('./service/addComment'));
app.use('/getComments', require('./service/getComments')); 

// 템플릿 라우트 설정
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

app.get('/upload', (req, res) => {
  res.render('upload');
});

// 댓글 테스트 페이지 라우팅
app.get("/commentTest", (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'commentTest.html'));
});

// 댓글 목록 페이지 라우팅
app.get("/commentList", (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'commentList.html'));
});

// 로그인된 사용자 정보 반환
app.get('/api/auth/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.status(200).json(req.session.user);
});
const uploadRoutes = require('./service/upload');
app.use('/upload', uploadRoutes);
// OpenAI Chat 엔드포인트
// 서버 시작
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
