// Imports
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load env
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Setup Nodemailer
const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
      },
});

//Send email feedback
const sendEmail = (to, subject, text) => {
      const mailOptions = {
            from: process.env.EMAIL,
            to,
            subject,
            text,
      };

      transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                  console.log(error);
            } else {
                  console.log("Email sent: " + info.response);
            }
      });
};

// Setup Gemini here
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// const generateFeedback = async (jobTitle, userResponses) => {
//       try {
//             const prompt = `Generate feedback for a ${jobTitle} based on user responses: ${JSON.stringify(
//                   userResponses
//             )}`;
//             console.log("User responses:", userResponses);
//             const result = await model.generateContent(prompt);
//             return result.response.text();
//       } catch (error) {
//             console.error("Error generating AI feedback:", error);
//             return { error: "Failure to generate AI feedback" };
//       }
// };

let interviewData = {};

// endpoint where interview will start
app.post("/startInterview", async (req, res) => {
      try {
            console.log("is the interview starting?");
            const { email, jobTitle } = req.body;
            console.log("Email recieved: ", email);
            console.log("Job Title recieved: ", jobTitle);
            // console.log("user Response aquired: ", req.body.userResponse);
            const introduction = `Tell me about yourself and why you are interested in the ${jobTitle} position?`;

            const chat = model.startChat({
                  history: [
                        {
                              role: "user",
                              parts: [
                                    {
                                          text: `Hello, I am ${email} and I am interested in the ${jobTitle} position.`,
                                    },
                              ],
                        },
                        {
                              role: "model",
                              parts: [{ text: "Tell me about yourself" }],
                        },
                        {
                              role: "user",
                              parts: [{ text: introduction }],
                        },
                  ],
            });

            const result = await chat.sendMessage(introduction);
            const aiResponse = result.response ? result.response.text() : result.text;

            const nextQuestionResult = await chat.sendMessage("Ask me the first interview question.");
            const aiNextQuestion = nextQuestionResult.response.text();

            // console.log(chat);
            chat.params.history.push({
                  role: "model",
                  parts: [{ text: aiNextQuestion }],
            });

            res.json({ message: "Interview started!", question: aiNextQuestion });
      } catch (error) {
            console.error("Error with interview:", error);
            res.status(400).json({ error: "Interview failed" });
      }
});

// nah we continue the interview
app.post("/continueInterview", async (req, res) => {
      try {
            const { email, userResponse } = req.body;
            if (!userResponse) {
                  return res.status(400).json({ error: "Please provide a response" });
            }

            if (!chat) {
                  return res.status(400).json({ error: "Interview not found, reload window" });
            }

            // Send user's response to AI
            chat.history.push({
                  role: "user",
                  parts: [{ text: userResponse }],
            });
            const result = await chat.sendMessage("Ask me the next interview question.");
            const aiNextResponse = result.response.text();

            chat.history.push({
                  role: "model",
                  parts: [{ text: aiNextResponse }],
            });

            res.json({ question: aiNextResponse });

            // Send response
      } catch (error) {
            console.error("Error continuing interview:", error);
            res.status(500).json({ error: "Failed to continue interview." });
      }
});

// endpoint to store responses
app.post("/storeResponse", (req, res) => {
      console.log("IS the store response working?");
      const { email, question, answer } = req.body;

      if (interviewData[email]) {
            interviewData[email].responses.push({ question, answer });
            res.json({ message: "Response stored!" });
      } else {
            res.status(400).json({ error: "Interview not found 😲😲" });
      }
});

app.post("/aiResponse", async (req, res) => {
      console.log("Is the AI response working?");
      const { email, jobTitle } = req.body;
      const userResponses = interviewData[email]?.responses;

      if (userResponses && userResponses.length > 0) {
            const feedback = await generateFeedback(jobTitle, userResponses);

            if (feedback) {
                  res.json({ feedback });
            } else {
                  res.status(400).json({ error: "Error generating feedback" });
            }
      } else {
            res.status(400).json({ error: " Don't have users response " });
      }
});

// complete interview endpoint
app.post("/completedInterview", async (req, res) => {
      console.log("Is this completed interview working?");
      const { email } = req.body;
      const userResponses = interviewData[email]?.responses;

      if (userResponses) {
            const jobTitle = interviewData[email].jobTitle;
            const feedback = await generateFeedback(jobTitle, userResponses);

            // Users interview feedback
            sendEmail(email, "Interview Feedback", feedback?.feedback || "Just incase no feedback recieved.");

            res.json({ feedback });
      } else {
            res.status(400).json({ error: "Error finding the interview 😭😭" });
      }
});

// Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
});

export default app;
