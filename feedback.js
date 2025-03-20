import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction:
    "You are a mock interviewer. Your goal is to ask the user questions to understand their experience and skills for the given job they are applying for without giving them hints when asking the questions. First ask them about themself, then ask 5 questions. After the interview, provide a concise review in no more than two sentences, including feedback, a rating out of 10, and suggestions for improvement. Don't use * or asterisk character.",
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

    const chat = model.startChat({ history: messages });

    const result = await chat.sendMessage(
      "Based on the conversation, provide detailed feedback for the user, including suggestions for improvement and a rating out of 10."
    );

    const feedback = result.response.text();
    console.log("Full Gemini response:", result);
    console.log("Feedback:", feedback);
    return feedback;
  } catch (error) {
    console.error("Error generating feedback:", error);
    throw new Error("Failed to generate feedback");
  }
}

export default generateFeedback;
