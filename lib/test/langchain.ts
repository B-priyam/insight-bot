"use server";

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { PineconeStore } from "@langchain/pinecone";
import { Index, Pinecone, RecordMetadata } from "@pinecone-database/pinecone";
import { CohereEmbeddings } from "@langchain/cohere";
import fs from "fs";

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: "provider-3/gpt-4o-mini",
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// const docId = "my-first-doc";

async function namespaceExists(
  index: Index<RecordMetadata>,
  namespace: string
) {
  if (!namespace) {
    console.log("No namespace provided");
    throw new Error("No namespace provided");
  }
  try {
    const stats = await index.describeIndexStats();
    const exists = stats.namespaces?.[namespace] !== undefined;
    return exists;
  } catch (error) {
    console.error("Error describing index stats:", error);
    return false;
  }
}

export async function generateDocs(docId: string) {
  const loader = new PDFLoader(
    // "C:\\Users\\priya\\Downloads\\complete_project_Priyam.pdf"
    docId
  );

  const docs = await loader.load();
  console.log("----- Splitting the documents -----");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 128,
  });
  const splitdocs = await splitter.splitDocuments(docs);
  console.log(`--- split into ${splitdocs.length} parts ---`);
  return splitdocs;
}

export async function generateEmbeddingsInPineconeVectorStore(docId: string) {
  const indexName = "insight";
  let pineconeVectorStore;

  console.log("🔴", docId);

  const pinecone = new Pinecone({
    apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
  });

  console.log(" ------- generating embeddings --------");
  // const embeddings = new OpenAIEmbeddings({
  //   apiKey: process.env.OPENAI_API_KEY,
  //   configuration: {
  //     baseURL: process.env.OPENAI_BASE_URL,
  //   },
  //   model: "provider-4/text-embedding-3-large",
  // });

  const embeddings = new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY as string,
    model: "embed-english-v3.0",
  });

  const index = await pinecone.index(indexName);

  console.log("checking namespace");

  const namespaceAlreadyExists = await namespaceExists(index, docId);

  if (namespaceAlreadyExists) {
    console.log("namespace already exists");
    pineconeVectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: docId,
    });
    return pineconeVectorStore.namespace;
  } else {
    const splitDocs = await generateDocs(docId);
    console.log(
      `--- storing the documents in namespace ${docId} in the ${indexName} pinecone vector store ---`
    );

    pineconeVectorStore = await PineconeStore.fromDocuments(
      splitDocs,
      embeddings,
      {
        pineconeIndex: index,
        namespace: docId,
      }
    );
    console.log("completed");

    console.log(pineconeVectorStore.namespace);
    fs.unlinkSync(docId);
    return pineconeVectorStore.namespace;
  }
}

// const genAI = new GoogleGenerativeAIEmbeddings({
//   apiKey: process.env.GOOGLE_API_KEY!,
//   model: "embedding-001",
// });
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
