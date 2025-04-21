import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mime from "mime-types";
import { Pinecone } from "@pinecone-database/pinecone";
import { randomUUID } from "crypto";
import { CohereEmbeddings } from "@langchain/cohere";

// Constants
const MAX_EMBEDDING_SIZE = 15 * 1024 * 1024; // 15MB for each embedding segment

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Initialize Embeddings Model
const embeddingsModel = new CohereEmbeddings({
  apiKey: process.env.COHERE_API_KEY,
  model: "embed-english-v3.0",
});

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
});
const index = pinecone.index("insight");

// Convert file to base64
async function encodeFileToBase64(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return Buffer.from(fileBuffer).toString("base64");
}

// Get valid MIME type
function getMimeType(filePath: string): string | null {
  const mimeType = mime.lookup(filePath);
  return mimeType && mimeType !== "application/octet-stream" ? mimeType : null;
}

// Analyze files using Gemini
async function analyzeFiles(
  files: { filePath: string; fileName: string; mimeType: string }[]
) {
  const insightsByFile = [];

  for (const { filePath, fileName, mimeType } of files) {
    const base64File = await encodeFileToBase64(filePath);
    const geminiInput = [
      "Provide detailed insights about this file.",
      { inlineData: { data: base64File, mimeType } },
    ];

    const response = await model.generateContent(geminiInput);
    const insights = response.response.text().trim();
    insightsByFile.push({ fileName, insights });
  }

  return insightsByFile;
}

// Upload embeddings for each file
async function uploadToPinecone(
  insightsByFile: { fileName: string; insights: string }[],
  namespaceId: string
) {
  const vectors = await Promise.all(
    insightsByFile.flatMap(async ({ fileName, insights }) => {
      const embeddings = await embeddingsModel.embedQuery(insights);
      const chunkedEmbeddings: any = [];

      for (let i = 0; i < embeddings.length; i += MAX_EMBEDDING_SIZE) {
        chunkedEmbeddings.push({
          id: `chunk-${fileName}-${Date.now()}-${i / MAX_EMBEDDING_SIZE + 1}`,
          values: embeddings.slice(i, i + MAX_EMBEDDING_SIZE),
          metadata: {
            filename: fileName,
            source: "file-analysis",
            content: insights.substring(i, i + MAX_EMBEDDING_SIZE),
          },
        });
      }

      return chunkedEmbeddings;
    })
  );

  await index.namespace(namespaceId).upsert(vectors.flat());
  console.log(`✅ Uploaded ${vectors.flat().length} embeddings to Pinecone!`);
  return namespaceId;
}

// Handle POST request
export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const files = data.getAll("files") as File[];
    let namespaceId = data.get("namespaceId") as string | null;

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Generate a new namespace if not provided
    if (!namespaceId) {
      namespaceId = randomUUID();
    }

    const uploadDir = path.join(process.cwd(), "public/uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    let allFiles: { filePath: string; fileName: string; mimeType: string }[] =
      [];

    for (const file of files) {
      const filePath = path.join(uploadDir, file.name);
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, fileBuffer);

      const mimeType = getMimeType(filePath);
      if (!mimeType) {
        console.warn(`⚠️ Skipping unsupported file: ${file.name}`);
        continue;
      }

      allFiles.push({ filePath, fileName: file.name, mimeType });
    }

    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid files processed" },
        { status: 400 }
      );
    }

    const insightsByFile = await analyzeFiles(allFiles);

    await uploadToPinecone(insightsByFile, namespaceId);

    return NextResponse.json({ namespaceId });
  } catch (error) {
    console.error("Error processing files:", error);
    return NextResponse.json(
      { error: "Failed to process files" },
      { status: 500 }
    );
  }
}
