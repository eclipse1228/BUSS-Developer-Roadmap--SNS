import dotenv from "dotenv";
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path'; 
import { fileURLToPath } from 'url'; // ES 모듈에서 경로 처리를 위한 추가 모듈

dotenv.config();

// ES 모듈에서 __dirname 대신 사용할 변수 설정 (파일 경로 설정을 위한 ES 모듈)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function main() {
  // Create Assistant 
  const myAssistant = await client.beta.assistants.create({
    instructions:
      "You are a career counselor for computer science students. You receive a student's self-introduction letter, and suggest advice and a career roadmap.",
    name: "career counselor",
    tools: [{type: "file_search"}],
    model: "gpt-4-turbo",
  });

  console.log(myAssistant);


  // file 준비 (static 폴더에 있는 파일 경로 지정)
  const filePath = path.join(__dirname, '..', '..', 'static', 'backend_java.json');

  // 파일 경로 확인
  console.log("File paths:", filePath);

  try {
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
    // await client.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, file)
    await client.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
      files: file,
      });

    // assistant와 Vector 스토리지 연결 (Update to assistant to use the new vector store)
    await client.beta.assistants.update(myAssistant.id, {
      tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
    });

  } catch (error) {
    console.error("Error during file upload and vector store update:", error);
  }


  // // polling 하면서 백엔드에서 처리 완료되었는지 계속 확인한다. (polling 오류)
  // try {
  //   await client.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, fileStreams);
  // } catch (error) {
  //   console.error("Error during uploadAndPoll:", error);
  // }


  // // 쓰레드에 직접 문서를 넣기 (파일은 해당 쓰레드에서만 사용되는 벡터스토리지에 저장됨) (일회성,단건 파일 업로드용임 우리는 아직 사용 X )
  // const thread = await client.beta.threads.create({
  //   messages: [
  //     {
  //       role: "user",
  //       content: "i want to see java Backend RoadMap",
  //     },
  //   ],
  // });

  // The thread now has a vector store in its tool resources.
  // console.log(thread.tool_resources?.file_search);

//   const stream = client.beta.threads.runs
//     .stream(thread.id, {
//       assistant_id: myAssistant.id,
//     })
//     .on("textCreated", () => console.log("assistant >"))
//     .on("toolCallCreated", (event) => console.log("assistant " + event.type))
//     .on("messageDone", async (event) => {
//       if (event.content[0].type === "text") {
//         const { text } = event.content[0];
//         const { annotations } = text;
//         const citations = [];

//         let index = 0;
//         for (let annotation of annotations) {
//           text.value = text.value.replace(annotation.text, "[" + index + "]");
//           const { file_citation } = annotation;
//           if (file_citation) {
//             const citedFile = await client.files.retrieve(file_citation.file_id);
//             citations.push("[" + index + "]" + citedFile.filename);
//           }
//           index++;
//         }

//         console.log(text.value);
//         console.log(citations.join("\n"));
//       }
//     });
// }
}
main().catch(err => console.error(err));
