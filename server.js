// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Global variable to store website context built from articles.
let websiteContext = "";

/**
 * Fetch articles from your news backend API.
 */
async function fetchArticles() {
    try {
        const response = await fetch("https://backend-main-news-website.onrender.com/api/articles");
        const articles = await response.json();
        return articles;
    } catch (error) {
        console.error("Error fetching articles:", error);
        return [];
    }
}

/**
 * Build a context string from an array of articles.
 */
function buildContextFromArticles(articles) {
    if (!articles || articles.length === 0) return "No recent articles available.";

    const recentArticles = articles;
    const summaries = recentArticles.map(article => {
        const pubDate = new Date(article.pubDate).toLocaleDateString();
        return `Title: "${article.title}", Source: ${article.source_name || "Unknown"}, Published: ${pubDate}.`;
    });

    return `MyNews Website Context:\n${summaries.join("\n")}`;
}

/**
 * Update the global websiteContext variable.
 */
async function updateWebsiteContext() {
    const articles = await fetchArticles();
    websiteContext = buildContextFromArticles(articles);
    console.log("Updated website context for Gemini:");
    console.log(websiteContext);
}

// Update context immediately on server start, then every 5 minutes.
updateWebsiteContext();
setInterval(updateWebsiteContext, 5 * 60 * 1000);

/**
 * Get a chat response using the Gemini API.
 */
async function getChatResponse(userMessage) {
    try {
        // Initialize the Gemini API with your API key
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

        // For text-only input, use the gemini-1.0-pro model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

        // Create a chat session
        const chat = model.startChat({
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        });

        // Prepare system message with context
        const systemMessage = `You are MyNews Assistant, an expert on semiconductor and technology news. You help users by answering questions about current events, feature articles, and topics covered on MyNews.
        
        Here is some context about recent articles on the website:
        ${websiteContext}`;

        // Send system message first (as user message, since Gemini doesn't have dedicated system messages)
        await chat.sendMessage(systemMessage);

        // Then send user's actual question and get response
        const result = await chat.sendMessage(userMessage);
        const response = result.response;

        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return `Error calling Gemini API: ${error.message}`;
    }
}

/**
 * Chat endpoint: receives a user message and conversation history,
 * builds a prompt including website context, and returns the Gemini response.
 */
app.post("/api/chat", async (req, res) => {
    const { message } = req.body;

    try {
        const aiResponse = await getChatResponse(message);
        res.json({ response: aiResponse });
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({
            response: "Sorry, I'm having trouble connecting to my backend. Please try again later."
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Chatbot server running on port ${PORT}`));
