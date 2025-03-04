"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // Your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
});

interface File {
  path: string; // File path or URL for the file to upload
  name: string; // Name of the file (optional, for reference)
}

export async function uploadFiles(files: any) {
  try {
    const results = [];

    // Loop through the files and upload each one
    // for (let file of files) {
    const result = await cloudinary.uploader.upload(files.name, {
      file: "",
      resource_type: "auto",
    });
    results.push(result);
    // }

    console.log("Upload results:", results);
    return results;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
}

// Helper function to determine the resource type based on file extension
function getResourceType(file: File): "image" | "video" | "auto" {
  const ext = file.path.split(".").pop()!.toLowerCase();
  if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
    return "image";
  }
  if (["mp4", "avi", "mov"].includes(ext)) {
    return "video";
  }
  return "auto"; // Cloudinary will automatically detect the resource type
}
