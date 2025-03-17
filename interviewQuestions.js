const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const readline = require("readline");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction:
    "You are a mock interviewer. Your goal is to ask the user questions to understand their experience and skills for the given job they are applying for without giving them hints when asking the questions.",
});

let history = [
  {
    role: "user",
    parts: [{ text: "Job Title: Junior Developer" }],
  },
  {
    role: "model",
    parts: [{ text: "Tell me about yourself." }],
  },
  {
    role: "user",
    parts: [
      {
        text: "I'm passionate about software development. I joined Mission Ready earlier this year, and decided to switch from a chef to a full time software developer.",
      },
    ],
  },
];

async function sendUserMessage(history) {
  let chatText = "";

  const chat = model.startChat({
    history: history,
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const userInput = await new Promise((resolve) => {
    rl.question("Your response: ", (answer) => {
      resolve(answer);
      rl.close();
    });
  });

  let result = await chat.sendMessage(userInput);
  console.log(result.response.text());

  chatText = result.response.text();
  return { chatText, history };
}

(async () => {
  for (let i = 0; i < 5; i++) {
    const response = await sendUserMessage(history);
    response.history.forEach((message) => {
      console.log("-----");
      console.log(`${message.role}: ${message.parts[0].text}`);
    });
  }
})();

module.exports = { sendUserMessage };
