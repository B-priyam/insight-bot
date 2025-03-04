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

// Handle file uploads
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    console.log("🔴", files);
    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Upload files to Cloudinary
    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempPath = path.join(uploadDir, file.name);
        await fs.writeFile(tempPath, buffer);

        const result = await cloudinary.v2.uploader.upload(tempPath, {
          folder: "uploads",
        });

        await fs.unlink(tempPath); // Remove temp file

        return {
          public_id: result.public_id,
          url: result.secure_url,
          original_name: file.name,
        };
      })
    );

    return NextResponse.json(uploadResults);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// API route to delete images
export async function DELETE(req: NextRequest) {
  try {
    const { public_id } = await req.json();

    if (!public_id) {
      return NextResponse.json({ error: "Missing public_id" }, { status: 400 });
    }

    await cloudinary.v2.uploader.destroy(public_id);

    return NextResponse.json({ success: true, message: "Image deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
