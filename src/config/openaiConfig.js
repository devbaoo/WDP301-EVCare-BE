import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// OpenRouter configuration for Google Gemini
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "https://evcare.vn", // Optional. Site URL for rankings on openrouter.ai
    "X-Title": process.env.SITE_NAME || "EVCare Inventory System", // Optional. Site title for rankings on openrouter.ai
  },
});

export default openai;
