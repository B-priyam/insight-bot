import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs-extra";
import ffmpg from "fluent-ffmpeg";
import mime from "mime-types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ffmpeg from "fluent-ffmpeg";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function extractFrames(
  filePath: string,
  frameRate: number = 1
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const frames: string[] = [];
    const outputDir = path.join(__dirname, "frames");
    const outputPattern = path.join(outputDir, "frame-%04d.png");

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    ffmpeg(filePath)
      .output(outputPattern)
      .outputOptions([`-vf fps=${frameRate}`])
      .on("end", () => {
        const frameFiles = fs
          .readdirSync(outputDir)
          .sort()
          .map((file) => path.join(outputDir, file));

        frameFiles.forEach((frameFile) => {
          const frameData = fs.readFileSync(frameFile);
          const base64 = frameData.toString("base64");
          frames.push(`data:image/png;base64,${base64}`);
        });

        // Clean up: Delete the extracted frames
        frameFiles.forEach((frameFile) => fs.unlinkSync(frameFile));
        fs.rmdirSync(outputDir);

        resolve(frames);
      })
      .on("error", (err) => {
        reject(new Error(`Error extracting frames: ${err.message}`));
      })
      .run();
  });
}

// Convert image to Base64
async function encodeImageToBase64(filePath: string) {
  const imageBuffer = await fs.readFile(filePath);
  return Buffer.from(imageBuffer).toString("base64");
}

// Analyze images with Gemini
async function analyzeFrames(frames: string[]) {
  const imageData = await Promise.all(
    frames.map(async (file) => ({
      fileName: path.basename(file),
      base64Image: await encodeImageToBase64(file),
      mimeType: mime.lookup(file) || "image/png",
    }))
  );

  const geminiInput = [
    "Analyze these video frames and provide detailed insights without introduction.",
    ...imageData.map((img) => ({
      inlineData: { data: img.base64Image, mimeType: img.mimeType },
    })),
  ];

  const response = await model.generateContent(geminiInput);

  return {
    insights: response.response.text(),
    analyzedFrames: imageData.map((img) => img.fileName),
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public/uploads");
    await fs.ensureDir(uploadDir);

    const videoPaths = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(uploadDir, file.name);
        await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
        return filePath;
      })
    );

    const allInsights = await Promise.all(
      videoPaths.map(async (videoPath) => {
        const frameDir = path.join(
          uploadDir,
          `frames-${path.basename(videoPath)}`
        );
        await fs.ensureDir(frameDir);

        const frames = await extractFrames(videoPath);
        console.log("🔴 118", frames);
        return await analyzeFrames(frames);
      })
    );

    return NextResponse.json({ insights: allInsights });
  } catch (error) {
    console.error("Error processing videos:", error);
    return NextResponse.json(
      { error: "Failed to process videos" },
      { status: 500 }
    );
  }
}

// Disable bodyParser
export const config = {
  api: {
    bodyParser: false,
  },
};
