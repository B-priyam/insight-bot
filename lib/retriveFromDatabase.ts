"use server";

import { client } from "./prisma";

export const getData = async (chatId: string) => {
  console.log(chatId);

  const data = await client.chat.findFirst({
    where: {
      id: chatId,
    },
    select: {
      documents: {
        select: {
          id: true,
          original_name: true,
          url: true,
        },
      },
      messages: {
        select: {
          content: true,
          role: true,
          timeStamp: true,
        },
      },
      namespaceId: true,
    },
  });

  return data;
};
