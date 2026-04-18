import pool from "./db";
import { generateEmbedding } from "./embeddings";

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function storeChunks(filename: string, chunks: string[]) {
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM document_chunks WHERE filename = $1", [
      filename,
    ]);

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      await client.query(
        `INSERT INTO document_chunks (filename, chunk_index, content, embedding)
                VALUES ($1, $2, $3, $4)`,
        [filename, i, chunks[i], JSON.stringify(embedding)],
      );
    }
  } finally {
    client.release();
  }
}

export async function searchSimilarChunks(
  query: string,
  topK: number = 5,
): Promise<string[]> {
  const queryEmbedding = await generateEmbedding(query);

  const result = await pool.query(
    `SELECT content, embedding FROM document_chunks`,
  );

  const scored = result.rows.map((row) => ({
    content: row.content,
    score: cosineSimilarity(queryEmbedding, JSON.parse(row.embedding)),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => r.content);
}
