import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
            "You are a mock interviewer. Your goal is to ask the user questions to understand their experience and skills for the given job they are applying for without giving them hints when asking the questions.",
});

// Hardcoded email for now - not using anymore
const hardcodedEmail = "sp33drunners@gmail.com";

const validateMessages = (messages) => {
      messages.forEach((message, index) => {
            if (!message.role || !message.content) {
                  throw new Error(`Message at index ${index} is missing required fields: role or content`);
            }
            // Removed strict role validation
            console.log(`Accepted role: ${message.role}`);
      });
};

const sanitizeMessages = (messages) => {
      return messages.map((msg) => ({
            role: msg.role.toLowerCase() === "ai" ? "model" : "user",
            content: msg.content,
            metadata: { jobTitle: msg.role },
      }));
};

// Removed question tracker

// API
app.post("/app/simulate", async (req, res) => {
      const { question } = req.body;
      try {
            if (!question || typeof question !== "string") {
                  throw new Error("Invalid or missing 'question' in request body");
            }

            const chat = model.startChat({
                  history: [{ role: "user", parts: [{ text: question }] }],
            });

            const result = await chat.sendMessage(question);

            if (!result || !result.response) {
                  throw new Error("No response from Gemini API");
            }

            const responseText = result.response?.text ? result.response.text() : "No response available";

            res.json({ response: responseText });
      } catch (error) {
            console.error("Error in /app/simulate:", error.message);
            res.status(500).json({ error: error.message });
      }
});

async function generateFeedback(messages) {
      console.log("Received messages", messages);
      console.log("Formatting messages for Gemini", messages);

      try {
            // Checking messages
            // messages.forEach((message, index) => {
            //       if (!message.role || !message.content) {
            //             console.error(`Message ${index} doesnt have required fields:`, message);
            //       }
            if (!messages || messages.length === 0) {
                  console.error("No messages received");
                  throw new Error("No messages in request");
            }

            const formattedHistory = messages.map((message) => {
                  // Map 'ai' role to 'model' < doesn't matter all is being validated
                  const role = message.role.toLowerCase() === "ai" ? "model" : message.role.toLowerCase();
                  return {
                        role: role,
                        parts: [{ text: message.content }],
                  };
            });

            console.log("Formatted history", formattedHistory);

            const chat = model.startChat({ history: formattedHistory });

            const result = await chat.sendMessage(
                  "Based on the conversation, provide detailed feedback for the user, including suggestions for improvement and a rating out of 10."
            );

            const feedback = result.response.candidates[0]?.content?.parts?.[0]?.text || "No feedback generated";
            console.log("Full Gemini response:", result);
            console.log("Feedback:", feedback);
            return { feedback };
      } catch (error) {
            console.error("Error generating feedback:", error);
            throw new Error("Failed to generate feedback");
      }
}

// removed nodeMailer stuff, errors with invalid email etc

app.post("/completeInterview", async (req, res) => {
      const { messages } = req.body;

      console.log("Received messages", messages);

      if (!messages || !Array.isArray(messages)) {
            console.error("Missing or invalid messages array");
            return res.status(400).json({ message: "Missing messages" });
      }

      try {
            validateMessages(messages);
            const sanitizedMessages = sanitizeMessages(messages);

            const feedback = await generateFeedback(sanitizedMessages); // Generate feedback using entire history

            res.json({ success: true, feedback: feedback.feedback }); // Return feedback
      } catch (error) {
            console.error("Error in /completeInterview:", error);
            res.status(500).json({ error: "Failed to complete interview" });
      }
});

// Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
});

export default app;
