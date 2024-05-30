import OpenAI from "openai";
import dotenv from "dotenv";
/* Model List output Code*/
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function main() {
  try {
    const list = await openai.models.list();
    for (const model of list.data) {
      console.log(model);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
