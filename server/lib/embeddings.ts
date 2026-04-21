import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await model.embedContent({
    content: {
      parts: [{ text }],
      role: "user",
    },
  });
  return result.embedding.values;
}
