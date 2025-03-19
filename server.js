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
            "You are a mock interviewer. Your goal is to ask the user questions to understand their experience and skills for the given job they are applying for without giving them hints when asking the questions.",
});

// Hardcoded email for now
const hardcodedEmail = "sp33drunners@gmail.com";

// API
app.post("/app/simulate", async (req, res) => {
      const { question } = req.body;
      try {
            const chat = model.startChat({
                  history: [{ role: "user", parts: [{ text: question }] }],
            });
            const result = await chat.sendMessage(question);
            res.json({ response: result.response.text() });
      } catch (error) {
            res.status(500).json({ error: error.message });
      }
});

app.post("/completeInterview", async (req, res) => {
      console.log("Hopefully the completed intereview is working");

      const { messages } = req.body;

      if (!messages) {
            return res.status(400).json({ message: "Missing messages" });
      }
      const feedback = await generateFeedback(messages);

      try {
            await sendEmail(
                  hardcodedEmail,
                  "Interview Feedback",
                  feedback?.feedback || "Just incase no feedback recieved."
            );

            res.json({ success: true, feedback });
      } catch (error) {
            console.error("Error with completed interview", error);
            res.status(500).json({ error: "Failed to complete interview" });
      }
});

// Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
});

export default app;
