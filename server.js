const dotenv = require("dotenv");
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const { MongoClient, GridFSBucket } = require('mongodb');
const connectDB = require("./config/db");
const addLikeRouter = require('./service/addlike');

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

// 서비스 라우트 설정
app.use("/register", require("./service/register"));
app.use("/login", require("./service/login"));
app.use("/", require("./service/gettopwriter"));  // 여기서 main.js를 불러옴
app.use("/logout", require("./service/logout"));
app.use("/editProfile", require("./service/editProfile"));
app.use("/createPost", require("./service/createPost")); // 게시물 작성 API 라우트 추가
app.use("/comments", require("./service/comment"));  // 댓글 라우트 추가
app.use('/board', require('./service/board'));
app.use('/showPost', require('./service/showPost'));
app.use('/addComment', require('./service/addComment'));
app.use('/getComments', require('./service/getComments')); 
app.use('/addLike', addLikeRouter);
app.use("/", require("./service/main"));

// 서버 시작
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
