import express, { Request, Response } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { chunkText } from "../lib/chunker";
import { storeChunks } from "../lib/vectorStore";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    if (req.file.mimetype !== "application/pdf") {
      res.status(400).json({ error: "Only PDF files are supported" });
      return;
    }

    //Extract text from PDF
    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    const text = result.text;

    if (!text.trim()) {
      res.status(400).json({ error: "Could not extract text from PDF" });
      return;
    }

    //Chunk the text
    const chunks = chunkText(text);

    //Generate embeddings and store in DB
    await storeChunks(req.file.originalname, chunks);

    res.json({
      message: "File uploaded and processed successfully",
      filename: req.file.originalname,
      chunks: chunks.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
});

export default router;
