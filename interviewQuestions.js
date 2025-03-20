import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction:
    "You are a mock interviewer. Your goal is to ask the user questions to understand their experience and skills for the given job they are applying for without giving them hints when asking the questions.",
});

export async function sendUserMessage(history, userInput) {
  const chat = model.startChat({ history });

  const result = await chat.sendMessage(userInput);
  console.log(result.response.text());

  return { chatText: result.response.text() };
}
