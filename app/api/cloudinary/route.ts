import { NextRequest, NextResponse } from "next/server";
import cloudinary from "cloudinary";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage config
const uploadDir = path.join(process.cwd(), "uploads");
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Function to get Cloudinary upload options
const getUploadOptions = (fileType: string): cloudinary.UploadApiOptions => {
  console.log("🔴 ", fileType);
  if (fileType.startsWith("image")) {
    return {
      folder: "uploads",
      quality: "auto:best", // Optimized quality
      // format: "auto",
      // fetch_format: "auto",
      bit_rate: "1000k",
    };
  } else if (fileType.startsWith("video")) {
    return {
      folder: "uploads",
      resource_type: "video", // Required for videos
      quality: "auto:good",
      format: "mp4",
      bit_rate: "800k", // Keeps quality while reducing size
    };
  } else {
    return {
      folder: "uploads",
    };
  }
};

// Handle file uploads
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Upload files to Cloudinary
    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempPath = path.join(uploadDir, file.name);
        await fs.writeFile(tempPath, buffer);

        const mimeType = file.type; // Get file type
        const options = getUploadOptions(mimeType);

        const result = await cloudinary.v2.uploader.upload(tempPath, options);

        await fs.unlink(tempPath); // Remove temp file

        return {
          public_id: result.public_id,
          url: result.secure_url,
          original_name: file.name,
          size: file.size,
        };
      })
    );

    return NextResponse.json(uploadResults);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// API route to delete files
export async function DELETE(req: NextRequest) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: "Missing public_id" }, { status: 400 });
    }

    await cloudinary.v2.uploader.destroy(public_id);

    return NextResponse.json({ success: true, message: "File deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
