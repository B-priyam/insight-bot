import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import multer from "multer";

// ✅ Configure Gemini API
const apiKey: string | undefined = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ✅ Setup Multer for temporary file storage
const uploadDir = path.join(process.cwd(), "public/uploads");
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

function getMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  const mimeTypes: { [key: string]: string } = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".svg": "image/svg+xml",
  };

  return mimeTypes[extension] || "application/octet-stream"; // Default MIME type
}

/**
 * Converts an image file to Base64 format.
 */
const encodeImageToBase64 = async (filePath: string): Promise<Part> => {
  const buffer = await fs.promises.readFile(filePath);
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: getMimeType(filePath),
    },
  };
};

/**
 * ✅ Server Action: Handles image uploads & analysis.
 */
export async function analyzeImages(
  files: File[],
  chatHistory?: { role: "user" | "assistant"; content: string }[]
) {
  if (!files || files.length === 0) {
    throw new Error("No files received.");
  }

  try {
    // ✅ Save uploaded files to disk using Multer
    const savedFilePaths: string[] = [];
    await Promise.all(
      files.map(async (name) => {
        const filePath = path.join(uploadDir, name);
        savedFilePaths.push(filePath);
        await fs.promises.writeFile(
          filePath,
          Buffer.from(await file.arrayBuffer())
        );
      })
    );

    // ✅ Convert images to Base64
    const imageParts: Part[] = await Promise.all(
      savedFilePaths.map(encodeImageToBase64)
    );

    // ✅ Format chat history for Gemini API
    const formattedHistory: Part[] = chatHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // ✅ Construct prompt
    const prompt: Part = {
      role: "user",
      content:
        "Analyze the following images considering the context of our chat history.",
    };

    // ✅ Send request to Gemini API
    const result = await model.generateContent([
      prompt,
      ...formattedHistory,
      ...imageParts,
    ]);

    // ✅ Clean up: Delete uploaded files
    await Promise.all(
      savedFilePaths.map((filePath) => fs.promises.unlink(filePath))
    );

    return result.response.text();
  } catch (error) {
    console.error("Error processing images:", error);
    throw new Error("Error processing images");
  }
}
