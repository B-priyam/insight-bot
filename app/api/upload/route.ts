import { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import path from "path";

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./public/uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Middleware to handle file uploads
const uploadMiddleware = upload.array("files", 10); // Allow up to 10 files

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing to allow Multer to handle it
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests are allowed" });
  }

  // Handle file uploads
  uploadMiddleware(req, res, async (err: any) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "File upload failed", error: err.message });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    try {
      // Process files with the Gemini API
      const insights = await processFilesWithGemini(files);
      return res
        .status(200)
        .json({ message: "Files processed successfully", insights });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: "Error processing files", error: error.message });
    }
  });
}

// Function to process files with the Gemini API
async function processFilesWithGemini(files: Express.Multer.File[]) {
  const insights: { filename: string; insight: any }[] = [];

  for (const file of files) {
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      file.filename
    );
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Call the Gemini API (replace with your actual API endpoint and logic)
    const response = await axios.post("https://api.gemini.com/analyze", {
      file: fileContent,
    });

    insights.push({
      filename: file.originalname,
      insight: response.data.insight, // Adjust based on the Gemini API response
    });
  }

  return insights;
}
