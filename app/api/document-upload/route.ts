import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { Pinecone } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CohereEmbeddings } from "@langchain/cohere";
import path from "path";

// Function to split text into chunks with overlap
function chunkText(text: string, chunkSize = 1024, overlap = 100) {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

// Function to process PDFs (preserving page numbers)
async function processPDF(filePath: string, filename: string) {
  const loader = new PDFLoader(filePath, { splitPages: true });
  const pages = await loader.load();

  return pages.flatMap((page, index) => {
    const chunks = chunkText(page.pageContent);
    return chunks.map((chunk, chunkIndex) => ({
      pageContent: chunk,
      metadata: {
        filename,
        page: index + 1,
        chunk: chunkIndex + 1,
      },
    }));
  });
}

// Function to process Word Documents
async function processDocx(filePath: string, filename: string) {
  const loader = new DocxLoader(filePath);
  const doc = await loader.load();

  return doc.flatMap((chunk, index) => {
    const chunks = chunkText(chunk.pageContent);
    return chunks.map((subChunk, chunkIndex) => ({
      pageContent: subChunk,
      metadata: {
        filename,
        page: index + 1,
        chunk: chunkIndex + 1,
      },
    }));
  });
}

// Function to process TXT files
async function processTxt(filePath: string, filename: string) {
  const loader = new TextLoader(filePath);
  const doc = await loader.load();

  return doc.flatMap((chunk) => {
    const chunks = chunkText(chunk.pageContent);
    return chunks.map((subChunk, chunkIndex) => ({
      pageContent: subChunk,
      metadata: {
        filename,
        page: 1,
        chunk: chunkIndex + 1,
      },
    }));
  });
}

// **Named Export for POST Requests**
export async function POST(req: NextRequest) {
  try {
    console.log("🔴 Upload started...");

    // Extract FormData from request
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    let namespaceId = formData.get("namespaceId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Set up upload directory
    const uploadDir = path.join(process.cwd(), "public/uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const processedDocs: any[] = [];

    // Save files and process content
    const filePaths = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(uploadDir, file.name);
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, fileBuffer);

        const ext = path.extname(file.name).toLowerCase();
        let docsWithMetadata: any[] = [];

        if (ext === ".pdf") {
          docsWithMetadata = await processPDF(filePath, file.name);
        } else if (ext === ".docx") {
          docsWithMetadata = await processDocx(filePath, file.name);
        } else if (ext === ".txt") {
          docsWithMetadata = await processTxt(filePath, file.name);
        } else {
          console.warn(`Unsupported file type: ${ext}`);
        }

        processedDocs.push(...docsWithMetadata);
        return filePath;
      })
    );

    const indexName = "insight";
    const pinecone = new Pinecone({
      apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
    });

    const embeddings = new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY,
      model: "embed-english-v3.0",
    });

    const index = await pinecone.index(indexName);

    console.log(`🔍 Checking if namespace '${namespaceId}' exists...`);

    if (!namespaceId) {
      namespaceId = uuidv4();
      console.log(`🆕 Generating new namespace ID: ${namespaceId}`);
    }

    console.log(
      `📌 Generating embeddings for ${processedDocs.length} document chunks...`
    );

    // Generate embeddings for each chunk
    const vectors = await Promise.all(
      processedDocs.map(async (doc) => {
        const vector = await embeddings.embedQuery(doc.pageContent);
        return {
          id: uuidv4(),
          values: vector,
          metadata: {
            filename: doc.metadata.filename,
            page: doc.metadata.page,
            pageContent: doc.pageContent,
          },
        };
      })
    );

    console.log(`🔄 Upserting ${vectors.length} vectors into Pinecone...`);

    // Use upsert to add/update vectors in Pinecone
    await index.namespace(namespaceId).upsert(vectors);

    console.log("✅ Upsert completed successfully.");

    return NextResponse.json(
      { success: true, namespaceId: namespaceId },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error processing files:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
