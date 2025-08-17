"use server";

import { currentUser } from "@clerk/nextjs/server";
import { client } from "./prisma";
import { v4 as uuid } from "uuid";

export const save = async (data: any) => {
  const files = data.files || [];
  const messages = data.messages || [];
  const namespaceId = data.namespaceId || "";

  const user = await currentUser();

  let chat: any;

  if (data.chatId) {
    chat = await client.chat.findUnique({
      where: {
        id: data.chatId,
      },
    });
  }

  if (!chat?.id) {
    chat = await client.chat.create({
      data: {
        userid: user?.id!,
        namespaceId: namespaceId,
        title: data.title,
        type: data.type,
      },
    });
  }

  // Save documents
  if (files.length > 0) {
    const documentsData = files.map((file: any) => ({
      chatId: chat.id,
      original_name: file.original_name,
      url: file.url,
    }));

    await client.document.createMany({
      data: documentsData,
      skipDuplicates: true,
    });
  }

  // Save messages and their sources
  for (const message of messages) {
    const savedMessage = await client.message.create({
      data: {
        chatId: chat.id,
        role: message.role,
        content: message.content,
        timeStamp: message.timestamp,
      },
    });

    if (message.role === "system" && Array.isArray(message.source)) {
      const sourceData = message.source.map((src: any) => ({
        pageNo: src.page || "1",
        filename: src.filename || "Unknown File",
        snippet: src.contentSnippet || "",
        messageId: savedMessage.id,
      }));

      if (sourceData.length > 0) {
        await client.source.createMany({
          data: sourceData,
        });
      }
    }
  }

  return chat.id;
};

export const saveMessages = async (
  userMessage: any,
  systemMessage: any,
  chatId: string
) => {
  try {
    const usersMessage = await client.message.create({
      data: {
        content: userMessage?.content,
        role: userMessage?.role,
        chatId: chatId,
        timeStamp: userMessage?.timestamp,
      },
    });

    const systemsMessage = await client.message.create({
      data: {
        content: systemMessage?.content,
        role: systemMessage?.role,
        chatId: chatId,
        timeStamp: systemMessage?.timestamp,
      },
    });

    if (Array.isArray(systemMessage.source)) {
      const sourceData = systemMessage.source.map((src: any) => ({
        pageNo: src.page || "1",
        filename: src.filename || "Unknown File",
        snippet: src.contentSnippet || "",
        messageId: systemsMessage.id,
      }));

      if (sourceData.length > 0) {
        await client.source.createMany({
          data: sourceData,
        });
      }
    }

    return { status: 200 };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const saveDocuments = async (documents: any, chatId: string) => {
  const documentsData = documents.map((file: any) => ({
    chatId: chatId,
    original_name: file.original_name,
    url: file.url,
  }));

  await client.document.createMany({
    data: documentsData,
    skipDuplicates: true,
  });

  return { status: 200 };
};
