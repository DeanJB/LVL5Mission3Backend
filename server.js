import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Setup Gemini here
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction:
    "You are a mock interviewer. Your goal is to ask the user questions to understand their experience and skills for the given job they are applying for without giving them hints when asking the questions. First ask them about themselves then ask 6 questions and after finishing those questions give feedback on the interview.",
});

let history = [];

// API
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Node.js Backend!" });
});

app.post("/app/simulate", async (req, res) => {
  const question = req.body.question;

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

// Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
