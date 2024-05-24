import dotenv from "dotenv";
import OpenAI from 'openai';
/* Assistant Creation Area */ 
dotenv.config();

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

async function main() {
  const myAssistant = await openai.beta.assistants.create({
    instructions:
      "You are a career counselor for computer science students. You receive a student's self-introduction letter, and suggest advice and a career roadmap.",
    name: "career counselor",
    tools: [{ type: "code_interpreter" }],
    model: "gpt-4-turbo",
  });

  console.log(myAssistant);
}

main();

// 진행중 - 고병수
// /* A Thread represents a conversation between a user */
// thread = client.beta.threads.create()

// /* Thread 에 메세지 추가: 사용자 또는 응용 프로그램에서 만든 메시지의 내용은 Thread에 Message 개체로 추가됩니다. */
// message = client.beta.threads.messages.create(
//     thread_id=thread.id,
//     role="user",
//     content=""
//   )
// /* streaming event 형식의 응답 받기 */
//   const run = openai.beta.threads.runs.stream(thread.id, {
//     assistant_id: assistant.id
//   })
//     .on('textCreated', (text) => process.stdout.write('\nassistant > '))
//     .on('textDelta', (textDelta, snapshot) => process.stdout.write(textDelta.value))
//     .on('toolCallCreated', (toolCall) => process.stdout.write(`\nassistant > ${toolCall.type}\n\n`))
//     .on('toolCallDelta', (toolCallDelta, snapshot) => {
//       if (toolCallDelta.type === 'code_interpreter') {
//         if (toolCallDelta.code_interpreter.input) {
//           process.stdout.write(toolCallDelta.code_interpreter.input);
//         }
//         if (toolCallDelta.code_interpreter.outputs) {
//           process.stdout.write("\noutput >\n");
//           toolCallDelta.code_interpreter.outputs.forEach(output => {
//             if (output.type === "logs") {
//               process.stdout.write(`\n${output.logs}\n`);
//             }
//           });
//         }
//       }
//     });