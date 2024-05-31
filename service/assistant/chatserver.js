import dotenv from "dotenv";
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path'; 
import express from 'express';
import bodyParser from 'body-parser';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
/* .env 파일에 OPENAI_API_KEY */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let assistant;

// Body-parser 설정
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'templates')));

// Create Assistant once 
(async () => {
  try {
    assistant = await client.beta.assistants.create({
      instructions:
        "You are a career counselor for computer science students. You receive a student's self-introduction letter, and suggest advice and a career roadmap.",
      name: "career counselor",
      tools: [{ type: "file_search" }],
      model: "gpt-4-turbo",
    });

    console.log("Assistant created:", assistant);

    const filePath = path.join(__dirname, 'static', 'backend_java.json');

    // 파일 업로드
    const file = [filePath].map((filePath) => fs.createReadStream(filePath));

    // Vector Storage 생성 (1GB까지는 무료인데, 그 이상 증가시, gb당 시간당 10센트 더 받음 1일 이후 삭제) (최대 : 512MB)
    let vectorStore = await client.beta.vectorStores.create({
      name: "RoadMap",
      expires_after: {
        "anchor": "last_active_at",
        "days": 1
      }
    });

    // 파일을 벡터 스토어에 추가
    await client.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
      files: file,
    });

    // assistant와 Vector 스토리지 연결 (Update to assistant to use the new vector store)
    await client.beta.assistants.update(assistant.id, {
      tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
    });

    console.log("Vector store created and files uploaded");
  } catch (error) {
    console.error("Error during initialization:", error);
  }
})();

// 루트 라우트 설정
app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'chat.html'));
});

/* Chating Room */
app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    const thread = await client.beta.threads.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const stream = client.beta.threads.runs
      .stream(thread.id, {
        assistant_id: assistant.id,
      })
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

          // 응답을 전송합니다.
          res.status(200).send({ bot: text.value });
        }
      });

  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
