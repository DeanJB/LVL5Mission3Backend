import express, { text } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendUserMessage } from "./interviewQuestions.js";
import generateFeedback from "./feedback.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(cors({ origin: "*" }));
app.use(express.json());

// Setup Gemini here
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction:
    "You are a mock interviewer. Your goal is to ask the user questions to understand their experience and skills for the given job they are applying for without giving them hints when asking the questions. First ask them about themself, then ask 5 questions. After the interview, provide a concise review in no more than two sentences, including feedback, a rating out of 10, and suggestions for improvement. Don't use asterisk character.",
});

// removed nodeMailer stuff, errors with invalid email etc

app.post("/completeInterview", async (req, res) => {
  const { question } = req.body;
  history.push({ role: "user", parts: [{ text: question }] });

  try {
    const feedback = await generateFeedback(history); // Generate feedback using entire history
    res.status(200).json({ response: feedback });
  } catch (error) {
    console.error("Error in /completeInterview:", error);
    res.status(500).json({ error: "Failed to complete interview" });
  }
});
let history = [];

// API
app.post("/startInterview", async (req, res) => {
  const question = req.body.question;
  console.log("start");
  history = [];
  try {
    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(question);

    res.json({ response: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/interview", async (req, res) => {
  const question = req.body.question;
  console.log(question);
  try {
    const { chatText } = await sendUserMessage(history, question);

    res.status(200).json({ response: chatText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
