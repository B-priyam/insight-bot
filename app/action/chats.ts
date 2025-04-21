"use server";

import { client } from "@/lib/prisma";
import { useUser } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export const getAllChats = async () => {
  const user = await currentUser();
  console.log(user?.id);
  const data = await client.chat.findMany({
    where: {
      userid: user?.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      messages: {
        orderBy: {
          timeStamp: "asc",
        },
        take: 1,
        select: {
          content: true,
        },
      },
      title: true,
      type: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });
  return data;
};
