import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mime from "mime-types";
import { Pinecone } from "@pinecone-database/pinecone";
import { randomUUID } from "crypto";
import { CohereEmbeddings } from "@langchain/cohere";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Initialize Embeddings Model (Using Cohere for better performance)
const embeddingsModel = new CohereEmbeddings({
  apiKey: process.env.COHERE_API_KEY,
  model: "embed-english-v3.0",
});

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
});
const index = pinecone.index("insight");

// Convert image to base64
async function encodeImageToBase64(filePath: string): Promise<string> {
  const imageBuffer = await fs.readFile(filePath);
  return Buffer.from(imageBuffer).toString("base64");
}

// Get MIME type
function getMimeType(filePath: string): string {
  return mime.lookup(filePath) || "application/octet-stream";
}

// Analyze images using Gemini API and store full response
async function analyzeImages(files: { filePath: string; fileName: string }[]) {
  const imageData = await Promise.all(
    files.map(async ({ filePath, fileName }) => ({
      fileName,
      base64Image: await encodeImageToBase64(filePath),
      mimeType: getMimeType(filePath),
    }))
  );

  const geminiInput = [
    "Provide very detailed insights about these images.",
    ...imageData.map((image) => ({
      inlineData: { data: image.base64Image, mimeType: image.mimeType },
    })),
  ];

  const response = await model.generateContent(geminiInput);
  const fullResponseText = response.response.text().trim(); // Get the full response

  return files.map((file) => ({
    fileName: file.fileName,
    insights: fullResponseText, // Store full response in one string
  }));
}

// Upload single embeddings for each file
async function uploadToPinecone(
  insightsByFile: { fileName: string; insights: string }[],
  namespaceId: string
) {
  const vectors = await Promise.all(
    insightsByFile.map(async ({ fileName, insights }) => ({
      id: `img-${fileName}-${Date.now()}`,
      values: await embeddingsModel.embedQuery(insights), // Embed full response
      metadata: {
        filename: fileName,
        source: "image-analysis",
        content: insights, // Store the full response as metadata
      },
    }))
  );

  await index.namespace(namespaceId).upsert(vectors);
  console.log(`✅ Uploaded ${vectors.length} vectors to Pinecone!`);
  return namespaceId;
}

// Handle POST request
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    let namespaceId = formData.get("namespaceId") as string | null;

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Generate a new namespace if not provided
    if (!namespaceId) {
      namespaceId = randomUUID();
    }

    const uploadDir = path.join(process.cwd(), "public/uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const fileData: { filePath: string; fileName: string }[] =
      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(uploadDir, file.name);
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          await fs.writeFile(filePath, fileBuffer);
          return { filePath, fileName: file.name };
        })
      );

    const insightsByFile = await analyzeImages(fileData);
    const finalNamespaceId = await uploadToPinecone(
      insightsByFile,
      namespaceId
    );

    return NextResponse.json({ namespaceId: finalNamespaceId, insightsByFile });
  } catch (error) {
    console.error("Error processing images:", error);
    return NextResponse.json(
      { error: "Failed to process images" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
