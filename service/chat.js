const express = require('express');
const router = express.Router();
const path = require('path');
const OpenAI = require('openai');
const fs = require('fs');
const { MongoClient, GridFSBucket } = require('mongodb');

const User = require('../db/User');
const { getTopWriters } = require('./topwriter');

router.use('/static', express.static(path.join(__dirname, 'static')));

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

let assistant;
let threadId;

// Assistant 초기화 로직
(async () => {
  try {
    // 상담용 채팅 어시스턴트
    assistant = await client.beta.assistants.create({
        instructions: `You are a career counselor for computer science students. you only send the roadmap json. Don't send this '''json ''',"Here is ~ Roadmap".  The JSON should follow this structure:
        {
          "category": {
            "topic": {
              "recommendation": "personal | alternative | notRecommended",
              "description": "Description of the topic",
              "course": "URL to the course"
            },
            ...
          },
          ...
        }
        For example, if the user is interested in "dataScience", the response should be focused on that keyword.
        `,
      name: "career counselor",
      tools: [{ type: "file_search" }],
      model: "gpt-4-turbo",
    });

    console.log("Assistant created:", assistant);

    const filePath = path.join(__dirname, '../static', 'backend_java.json');
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

// MongoDB 연결 설정
const mongoUrl = "mongodb://127.0.0.1:27017";
const dbName = 'test';

// MongoDb에 Roadmap json 저장 
const saveResponseToMongoDB = async (response, userId) => {
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const db = client.db(dbName);
    const roadmapCollection = db.collection('Roadmap');
    const usersCollection = db.collection('users');
    
    // 새 로드맵 문서를 Roadmap 컬렉션에 저장하고, 생성된 문서의 _id를 반환받습니다.
    try {
      const result = await roadmapCollection.insertOne(response);
      const roadmapId = result.insertedId;
      await usersCollection.updateOne({ _id: userId }, { $push: { roadmaps: roadmapId } });
    } catch (error) {
        console.error("Failed to save response or update user:", error);
    }
  } finally {
    await client.close();
  }
};

// chat 라우트 추가
router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../templates', 'chat.html'));

    const user = req.session.user;
    if (!user) {
      return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../templates', 'chat.html'));
  });
  
router.post("/", async (req, res) => {
    try {
      const { prompt } = req.body;
      const userId = req.session.user._id;  // 세션에서 사용자 ID 추출

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
            // Save to MongoDB here
            await saveResponseToMongoDB({ text: text.value }, userId);
            res.status(200).send({ bot: "로드맵을 업데이트했습니다." });
          }
        });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  });

  module.exports = router;
