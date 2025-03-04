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

// /**
//  * Retrieves relevant documents and generates an AI response.
//  * @param query The user query.
//  * @param namespaceId The namespace used in Pinecone.
//  * @param chatHistory The previous chat messages.
//  * @param filename Optional filename filter.
//  * @param limit Number of document snippets to retrieve (default: 5).
//  * @returns AI-generated response with relevant sources.
//  */
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
}) {
  try {
    if (!namespaceId) throw new Error("Namespace ID is required.");

    console.log(`🔹 Retrieving documents from namespace: ${namespaceId}`);

    // Load Pinecone index
    const index = await pinecone.index(PINECONE_INDEX_NAME);
    console.log("✅ Pinecone Index Loaded");

    // Generate embeddings using Cohere
    const embeddings = new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY!,
      model: "embed-english-v3.0",
    });

    // Load vector store from Pinecone using retriever
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: namespaceId,
    });

    console.log("✅ Vector Store Set");

    // Use retriever to get relevant documents
    const retriever = vectorStore.asRetriever({ k: limit });
    let retrievedDocs = await retriever.invoke(query);

    console.log(`📄 Retrieved ${retrievedDocs.length} documents`);

    // Apply filename filtering if specified
    if (filename) {
      retrievedDocs = retrievedDocs.filter(
        (doc) => doc.metadata.filename === filename
      );
      console.log(`📂 Filtered results for file: ${filename}`);
    }

    if (!retrievedDocs || retrievedDocs.length === 0) {
      const Response: Message = {
        role: "system",
        content: "I don't have enough information to answer your query.",
        timestamp: new Date(),
        source: null,
      };
      return Response;
    }

    // Extract relevant metadata for response
    const relevantDocs = retrievedDocs.slice(0, 3);
    const sources = relevantDocs.map(({ metadata, pageContent }) => ({
      filename: metadata.filename || "Unknown File",
      page: metadata.page || 1,
      contentSnippet: metadata.pageContent.slice(0, 250) + "...",
    }));

    // Prepare the context for AI response
    const contextText = retrievedDocs
      .map(
        (doc) =>
          `${doc.metadata.filename} (Page ${doc.metadata.page}):\n${doc.metadata.pageContent}`
      )
      .join("\n\n");

    const formattedChatHistory = chatHistory
      .map(
        (message) =>
          `${message.role === "user" ? "User" : "AI"}: ${message.content}`
      )
      .join("\n");

    const systemPrompt = `You are an AI assistant that strictly answers based on retrieved documents.
    If an answer is not found in the provided data, respond with: "I don't have enough information." 
    Use the retrieved context to answer accurately.`;

    const messages = [
      new AIMessage(systemPrompt),
      new HumanMessage(`Previous Chat History:\n${formattedChatHistory}\n\n`),
      new HumanMessage(
        `Retrieved Context:\n${contextText}\n\nUser Query: ${query}`
      ),
    ];

    // Generate response using Gemini AI
    const llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
      model: "gemini-2.0-flash",
    });

    const response = await llm.invoke(messages);
    console.log(`🔹 AI Response: ${response.content}`);

    console.log("🔴 sources", sources);

    const Response: Message = {
      role: "system",
      content: response.content.toString(),
      timestamp: new Date(),
      source: sources,
    };

    return Response;
  } catch (error) {
    console.error("❌ Error retrieving/generating response:", error);
    const Response: Message = {
      role: "system",
      content: "An error occurred while processing your request.",
      timestamp: new Date(),
      source: null,
    };
    return Response;
  }
}
