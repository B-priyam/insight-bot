"use server";

import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });

interface Message {
  role: "user" | "system";
  content: string;
  timestamp?: Date;
}

export const getImageResponse = async (
  instructions: string,
  chatHistory: Message[]
) => {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are an AI assistant that provide short but accurate accurate responses based on the provided data: '${instructions}' and previous chat history. If the requested information is unavailable, respond with 'Data or image not found.`,
      },
      ...chatHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ],
    model: "mixtral-8x7b-32768",
    temperature: 2,
  });

  const response: Message = {
    content: chatCompletion.choices[0].message.content || "",
    role: "system",
    timestamp: new Date(Date.now()),
  };

  return response;
};
