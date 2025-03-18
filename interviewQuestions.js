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

async function getJobTitle() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const jobTitle = await new Promise((resolve) => {
    rl.question("Enter Job Title: ", (answer) => {
      resolve(answer);
      rl.close();
    });
  });

  return jobTitle;
}

async function getUserIntroduction() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const introduction = await new Promise((resolve) => {
    rl.question("Tell me about yourself: ", (answer) => {
      resolve(answer);
      rl.close();
    });
  });

  return introduction;
}

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

async function lastAnswer() {
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const userInput2 = await new Promise((resolve) => {
    rl2.question("Your response: ", (answer) => {
      resolve(answer);
      rl2.close();
    });
  });

  history.push({
    role: "user",
    parts: [{ text: userInput2 }],
  });
}

(async () => {
  const jobTitle = await getJobTitle();
  const introduction = await getUserIntroduction();

  let history = [
    {
      role: "user",
      parts: [{ text: `Job Title: ${jobTitle}` }],
    },
    {
      role: "model",
      parts: [{ text: "Tell me about yourself." }],
    },
    {
      role: "user",
      parts: [{ text: introduction }],
    },
  ];

  for (let i = 0; i < 5; i++) {
    const { chatText, updatedHistory } = await sendUserMessage(history);
    history.push({
      role: "user",
      parts: [{ text: chatText }],
    });
  }
  await lastAnswer();

  history.forEach((message) => {
    console.log("-----");
    console.log(`${message.role}: ${message.parts[0].text}`);
  });
})();
