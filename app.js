// Import necessary libraries
const express = require("express");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const port = 5000;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Create an OpenAI client with the API key from the .env file
const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

// Define a route for the root URL '/'
// app.get("/", (req, res) => {
//   res.send("Hello"); // Send a response when the root URL is accessed
// });

// // Define an endpoint to create a new assistant
// app.post("/createAssistant", async (req, res) => {
//   // Use the OpenAI API to create a new assistant
//   const assistant = await openai.beta.assistants.create({
//     name: "Nola Assitant for Information", // Name of the assistant
//     description:
//       "You are the person who provide any information about Nola. You can give information from the Instagram account @nola.school", // Description of the assistant
//     model: "gpt-3.5-turbo-0125", // The model used by the assistant
//     instructions:
//       "You are the person who provide any information about Nola. You can give information from the Instagram account @nola.school", // Detailed instructions for the assistant
//     tools: [], // Additional tools for the assistant (if any)
//   });

//   res.send(assistant); // Send the created assistant object as a response
// });

// Add an endpoint to run the assistant
app.post("/chatbot", async (req, res) => {
  let body = req.body; // Get the request body
  let sThread = "";
  sAssistant = process.env["sAssistant"];

  // Check if it's a new conversation or an existing thread
  if (!body.sThread) {
    let oThread = await openai.beta.threads.create();
    sThread = oThread.id;
  }

  // Add a message to the thread
  await openai.beta.threads.messages.create(sThread, {
    role: "user",
    content: req.body.prompt,
  });

  // Run the assistant with the provided thread
  let run = await openai.beta.threads.runs.create(sThread, {
    assistant_id: sAssistant,
  });

  // Wait for the run to complete
  await waitForRunComplete(sThread, run.id);

  // Retrieve messages from the thread
  const threadMessages = await openai.beta.threads.messages.list(sThread);

  // Send the thread messages and thread ID as a response
  res.send({
    message: threadMessages.body.data[0].content[0].text.value,
    threadID: sThread,
  });
});

// Define a function to wait for a run to complete
async function waitForRunComplete(sThreadId, sRunId) {
  while (true) {
    const oRun = await openai.beta.threads.runs.retrieve(sThreadId, sRunId);
    if (
      oRun.status &&
      (oRun.status === "completed" ||
        oRun.status === "failed" ||
        oRun.status === "requires_action")
    ) {
      break; // Exit loop if run is completed, failed, or requires action
    }
    // Delay the next check to avoid high frequency polling
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
  }
}

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Service start on port ${port}`);
});
