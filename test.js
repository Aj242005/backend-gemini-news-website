// test.js
import dotenv from "dotenv";
import pkg from "@google/genai";

dotenv.config();
const { Chat } = pkg;

async function testChat() {
    try {
        const chatClient = new Chat({
            apiKey: process.env.GOOGLE_GENAI_API_KEY,
            model: "models/chat-bison-001", // Replace with your model if needed.
        });

        // Wrap the prompt in an object with a 'text' property:
        const promptObject = { text: "Hello, how are you?" };

        const result = await chatClient.sendMessage(promptObject, {
            temperature: 0.7,
            maxOutputTokens: 150,
        });

        console.log("Result from Gemini API:", result);
    } catch (error) {
        console.error("Error in testChat:", error);
    }
}

testChat();
