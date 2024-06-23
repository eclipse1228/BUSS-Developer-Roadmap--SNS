const express = require('express');
const router = express.Router();
const path = require('path');
const OpenAI = require('openai');
const fs = require('fs');
const { MongoClient, GridFSBucket } = require('mongodb');
const User = require('../db/User');
const { getTopWriters } = require('./topwriter');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));


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
      instructions: `You are a career counselor for computer science students. Your task is to create a roadmap JSON based on the user's input. The JSON should strictly follow this structure:

      {
        "category": {
          "topic": {
            "recommendation": "personal | alternative | notRecommended",
            "description": "Description of the topic",
            "course": "URL to the course"
          }
        }
      }
    
      Rules:
      1. 'category' must be one of: "frontend", "backend", or "devops".
      2. Include only relevant topics based on the user's input.
      3. Do not include any explanatory text outside the JSON structure.
      4. Ensure all JSON keys and values are enclosed in double quotes.
      5. The 'recommendation' value must be one of the three options provided.
      6. For 'course', provide a plausible URL or leave it as "URL to the course" if unknown.
      7. Limit the response to 5-7 topics maximum.
    
      Example for a frontend query:
      {
        "frontend": {
          "JavaScript": {
            "recommendation": "personal",
            "description": "Core language for web development",
            "course": "https://javascript.info/"
          },
          "React": {
            "recommendation": "personal",
            "description": "Popular frontend framework",
            "course": "https://reactjs.org/tutorial/tutorial.html"
          }
        }
      }
    
      Respond only with the JSON, no additional text.`,
      name: "career counselor",
      tools: [{ type: "file_search" }],
      model: "gpt-3.5-turbo-0125",
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
    
    // 새 로드맵 문서를 Roadmap 컬렉션에 저장하고, 생성된 문서의 _id를 반환받습니다.
    try {
      console.log("response:", response);
      const roadmap = JSON.parse(response.text);
      console.log("parsed roadmap:", roadmap);
      console.log("userId:", userId);
      const result = await roadmapCollection.insertOne({ roadmap, userId: userId });
      console.log("Roadmap saved:", result.insertedId, "for user:", userId);
      return { roadmap, _id: result.insertedId };  // 저장된 로드맵과 ID 반환
    } catch (error) {
        console.error("Failed to save response or update user:", error);
      throw error;  // 에러를 상위로 전파
    }
  } finally {
    await client.close();
  }
};

// chat 라우트 추가
router.get("/", (req, res) => {
    const user = req.session.user;
    if (!user) {
      return res.redirect('/login');
    }
    res.render('chat', { user }); // Render 'chat.ejs' with user data
  });


  router.post("/", async (req, res) => {
    try {
      const { contents } = req.body;

      if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized: User not logged in" });
      }
      const userId = req.session.user.id;
      console.log('userid:',userId);
      console.log('Received content:', contents);

    if (!contents) {
      return res.status(400).json({ error: "Missing content in request body" });
    }

      const thread = await client.beta.threads.create();

      await client.beta.threads.messages.create(thread.id, {
        role: "user",
      content: contents
      });
      const run = await client.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id
      });
      // 런이 완료될 때까지 기다립니다.
      let runStatus;
      do {
        runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      } while (runStatus.status !== 'completed');

      // 응답 메시지를 가져옵니다.
      const messages = await client.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');

      if (assistantMessage && assistantMessage.content[0].type === 'text') {
        const responseText = assistantMessage.content[0].text.value;
      console.log("responseText:", responseText);
      const savedRoadmap = await saveResponseToMongoDB({ text: responseText }, userId);
      res.status(200).json({ 
        message: "로드맵을 업데이트했습니다.",
        roadmap: savedRoadmap.roadmap
      });
      } else {
        throw new Error('No valid response from assistant');
      }
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
});

  // 로드맵 업데이트하고, response에 데이터 넘겨주기, (ejs에서는 받은 response로 로드맵을 그린다.)
  router.post("/updateRoadmap", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized: User not logged in" });
      }
    const userId = req.session.user.id;
    console.log("Updating roadmap for user:", userId);
      
      // MongoDB에서 최신 로드맵 데이터 조회
      const client = new MongoClient(mongoUrl);
      await client.connect();
      const db = client.db(dbName);
      const roadmapCollection = db.collection('Roadmap');
      
      const latestRoadmap = await roadmapCollection.findOne(
      { userId: userId },
        { sort: { _id: -1 } }
      );
  
      await client.close();
  
      if (latestRoadmap) {
      console.log('Sending roadmap data:', latestRoadmap.roadmap);
      res.status(200).json(latestRoadmap.roadmap);
      } else {
        console.log('No roadmap found for user:', userId);
        res.status(404).json({ error: "Roadmap not found" });
      }
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  module.exports = router;