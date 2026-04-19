import express, { Request, Response } from "express";
import { searchSimilarChunks } from "../lib/vectorStore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/", async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question?.trim()) {
      res.status(400).json({ error: "Question is required" });
      return;
    }

    //Find relevant chunks from DB
    const relevantChunks = await searchSimilarChunks(question);

    if (relevantChunks.length === 0) {
      res.status(400).json({ error: "No documents uploaded yet" });
      return;
    }

    const context = relevantChunks.join("\n\n---\n\n");

    const prompt = `You are a helpful assistant that answers questions based on the provided document context.
        Only answer based in the context below. If the answer is not in the conext, say "I couldn't find that in the document."

        Context:
        ${context}

        Question: ${question}

        Answer:`;

    //Stream the response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

export default router;
