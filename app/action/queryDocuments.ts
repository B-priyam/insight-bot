"use server";

import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { CohereEmbeddings } from "@langchain/cohere";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

interface Message {
  role: "user" | "system";
  content: string;
  timestamp?: Date;
  source?: any;
}

const PINECONE_INDEX_NAME = "insight";
const pinecone = new Pinecone({
  apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
});

/**
 * Retrieves relevant documents and generates an AI response.
 */
export async function retrieveDocuments({
  query,
  namespaceId,
  chatHistory,
  filename = null,
  limit = 5,
}: {
  query: string;
  namespaceId: string;
  chatHistory: Message[];
  filename?: string | null;
  limit?: number;
}): Promise<Message> {
  try {
    if (!namespaceId) throw new Error("Namespace ID is required.");

    console.log(`🔹 Retrieving documents from namespace: ${namespaceId}`);

    const index = await pinecone.index(PINECONE_INDEX_NAME);

    const embeddings = new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY!,
      model: "embed-english-v3.0",
    });

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: namespaceId,
    });

    console.log("✅ Vector Store Initialized");

    const retriever = vectorStore.asRetriever({ k: limit });
    let retrievedDocs = await retriever.invoke(query);

    console.log(`📄 Retrieved ${retrievedDocs.length} documents`);

    if (filename) {
      retrievedDocs = retrievedDocs.filter(
        (doc) => doc.metadata.filename === filename
      );
      console.log(`📂 Filtered results for file: ${filename}`);
    }

    if (!retrievedDocs.length) {
      return {
        role: "system",
        content: "I don't have enough information to answer your query.",
        timestamp: new Date(),
        source: null,
      };
    }

    // Extract sources
    const relevantDocs = retrievedDocs.slice(0, 3);
    const sources = relevantDocs.map(({ metadata }) => ({
      filename: metadata.filename || "Unknown File",
      page: metadata.page || 1,
      contentSnippet:
        (metadata.pageContent || metadata.text || "").slice(0, 250) + "...",
    }));

    const contextText = retrievedDocs
      .map(
        (doc) =>
          `${doc.metadata.filename} (Page ${doc.metadata.page}):\n${
            doc.metadata.pageContent || doc.metadata.text
          }`
      )
      .join("\n\n");

    const formattedChatHistory = chatHistory
      .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
      .join("\n");

    const systemPrompt = `You are an AI assistant that strictly answers based on retrieved documents.
If an answer is not found in the provided data, respond with: "I don't have enough information." 
Use the retrieved context to answer accurately.`;

    const messages = [
      new AIMessage(systemPrompt),
      new HumanMessage(`Previous Chat History:\n${formattedChatHistory}`),
      new HumanMessage(
        `Retrieved Context:\n${contextText}\n\nUser Query: ${query}`
      ),
    ];

    const llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      model: "gemini-2.0-flash",
    });

    const response = await llm.invoke(messages);
    console.log(`🤖 AI Response: ${response.content}`);

    return {
      role: "system",
      content: response.content.toString(),
      timestamp: new Date(),
      source: sources,
    };
  } catch (error) {
    console.error("❌ Error retrieving/generating response:", error);

    return {
      role: "system",
      content: "An error occurred while processing your request.",
      timestamp: new Date(),
      source: null,
    };
  }
}
