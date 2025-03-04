"use server";

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

interface Message {
  role: "user" | "system";
  content: string;
  timestamp?: Date;
}

export const getResponse = async (messages: Message[]) => {
  try {
    console.log("🔴 ---------- 🔴");
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Respond concisely and professionally.Provide a response in plain HTML format only. Use appropriate HTML tags to structure the content, such as <h1>, <p>, <ul>,<ol>, <li>, <strong>, <em>, <br/>, etc., but do not include any other explanatory text, introductions, or metadata. The HTML should be clean, directly usable, and formatted for rendering in a React component using dangerouslySetInnerHTML.",
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      model: "mixtral-8x7b-32768",
    });

    const aiResponse: Message = {
      role: "system",
      content: response.choices[0].message.content,
      timestamp: new Date(Date.now()),
    };

    return aiResponse;
  } catch (error) {
    console.error("Error fetching AI response:", error);
    throw new Error("Failed to fetch AI response.");
  }
};
