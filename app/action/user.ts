"use server";

import { client } from "@/lib/prisma"; // Ensure you have a Prisma Client instance
import { currentUser, auth } from "@clerk/nextjs/server";

export async function handleUserSignIn() {
  // Get user authentication data from Clerk
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  // Fetch user details directly from Clerk's SDK
  const user = await currentUser();

  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    throw new Error("Failed to fetch user details from Clerk.");
  }

  const email = user.emailAddresses[0].emailAddress;
  const firstName = user.firstName || null;
  const lastName = user.lastName || null;
  const image = user.imageUrl || null;
  const clerkid = user.id;

  try {
    // Check if user already exists in the database
    const existingUser = await client.user.findUnique({
      where: { clerkid },
    });

    if (!existingUser) {
      // Create a new user in the database
      await client.user.create({
        data: {
          email,
          firstName,
          lastName,
          clerkid,
          image,
        },
      });
    }
  } catch (error) {
    console.error("Error saving user to database:", error);
    throw new Error("Database error: Unable to save user.");
  }
}
