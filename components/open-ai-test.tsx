"use server";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "Free-For-YT-Subscribers-@DevsDoCode-WatchFullVideo",
  baseURL: "https://api.ddc.xiolabs.xyz/v1",
});

export async function main() {
  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are an AI that analyzes images." },
        { role: "user", content: "identify the personality" },
        {
          role: "user",
          content:
        },
      ],
      model: "provider-3/gpt-4o-mini",
    });

    console.log(chatCompletion.choices[0].message);
  } catch (error) {
    console.error("Error fetching response:", error);
  }
}
