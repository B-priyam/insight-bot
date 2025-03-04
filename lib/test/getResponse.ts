"use server";

import { Cohere, CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

export const getResponse = async () => {
  console.log("🔴", process.env.COHERE_API_KEY);
  console.log("started successfully");
  const cohere = new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY,
    model: "embed-english-v3.0",
  });

  console.log("cohere set");

  const pinecone = new Pinecone({
    apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!,
  });

  const index = await pinecone.index("insight");

  const docId = "my-first-doc";

  console.log("pinecone and index set");

  const vectorStore = await PineconeStore.fromExistingIndex(cohere, {
    pineconeIndex: index,
    namespace: docId,
  });

  console.log("vector data set");

  const retriever = vectorStore.asRetriever();

  console.log("retriver successfull");

  const retrievedDocuments = await retriever.invoke("");

  console.log(retrievedDocuments);
};
