"use server";

import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ChatCohere, CohereEmbeddings } from "@langchain/cohere";

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
 * Queries Pinecone using filename-based retrieval and generates a response using Gemini.
 * @param query The user query.
 * @param chatHistory The previous chat messages.
 * @param namespaceId The namespace used in Pinecone.
 * @returns AI response with relevant sources.
 */
export async function queryPinecone({
  query,
  chatHistory,
  namespaceId,
}: {
  query: string;
  chatHistory: Message[];
  namespaceId: string;
}) {
  try {
    if (!namespaceId) throw new Error("Namespace ID is required.");

    console.log(`🔹 Querying Pinecone Namespace: ${namespaceId}`);

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

    // Extract filename if mentioned in the query
    const filenameMatch = query.match(/file:\s*(\S+)/i);
    const filenameFilter = filenameMatch ? filenameMatch[1] : null;

    console.log("🔍 Filename filter:", filenameFilter || "None");

    // Use retriever with filename filtering
    const retriever = vectorStore.asRetriever({ k: 5 });
    let retrievedDocs = await retriever.invoke(query);

    console.log("📄 Retrieved Documents:", retrievedDocs.length);

    // Filter by filename if mentioned in query
    if (filenameFilter) {
      retrievedDocs = retrievedDocs.filter(
        (doc) => doc.metadata.filename === filenameFilter
      );
      console.log(`📂 Filtered results for file: ${filenameFilter}`);
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

    // Extract relevant document data
    const relevantDocs = retrievedDocs.slice(0, 3);

    const sources = relevantDocs.map(({ metadata, pageContent }) => ({
      filename: metadata.filename || "Unknown File",
      type: metadata.type || "text",
      contentSnippet: pageContent.slice(0, 200) + "...",
    }));

    // Prepare the context for Gemini AI
    const contextText = retrievedDocs
      .map((doc) => `${doc.metadata.filename}:\n${doc.metadata.content}`)
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

    const Response: Message = {
      role: "system",
      content: response.content.toString(),
      timestamp: new Date(),
      source: sources,
    };
    return Response;
  } catch (error) {
    console.error("❌ Error querying Pinecone:", error);
    const Response: Message = {
      role: "system",
      content: "An error occurred while processing your request.",
      timestamp: new Date(),
      source: null,
    };
    return Response;
  }
}
