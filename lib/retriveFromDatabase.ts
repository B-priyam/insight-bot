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
          id: true,
          source: {
            select: {
              pageNo: true,
              filename: true,
              snippet: true,
            },
          },
        },
        orderBy: {
          timeStamp: "asc", // optional: ensures messages are sorted chronologically
        },
      },
      namespaceId: true,
    },
  });

  return data;
};
