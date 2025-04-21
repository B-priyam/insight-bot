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

  const documentsData = files.map((file: any) => ({
    chatId: chat.id,
    original_name: file.original_name,
    url: file.url,
  }));

  const documents = client.document.createMany({
    data: documentsData,
    skipDuplicates: true, // Avoid inserting
  });

  const messageData = messages.map((message: any) => ({
    chatId: chat.id,
    role: message.role,
    content: message.content,
    timeStamp: message?.timestamp,
    // source: message?.source?.map((source: any) => ({
    //   pageNo: source.pageNo,
    // })),
  }));

  const message = client.message.createMany({
    data: messageData,
  });

  await client.$transaction([message, documents]);

  return chat.id;
};

export const saveMessages = async (
  userMessage: any,
  systemMessage: any,
  chatId: string
) => {
  try {
    const usersMessage = client.message.create({
      data: {
        content: userMessage?.content,
        role: userMessage?.role,
        chatId: chatId,
        timeStamp: userMessage?.timestamp,
      },
    });

    const systemsMessage = client.message.create({
      data: {
        content: systemMessage?.content,
        role: systemMessage?.role,
        chatId: chatId,
        timeStamp: systemMessage?.timestamp,
      },
    });

    await client.$transaction([usersMessage, systemsMessage]);
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
