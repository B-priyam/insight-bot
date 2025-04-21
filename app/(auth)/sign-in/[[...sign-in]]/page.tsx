"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useState } from "react";

const Page = () => {
  const [isMounted, setIsMounted] = useState(false);

  // Ensure the component is mounted before rendering Clerk components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Return null or a loading spinner until the component mounts
  }

  return (
    <div className="h-screen w-full flex items-center justify-center ">
      <div className="py-5 gap-10 justify-between flex flex-col w-1/2 md:w-1/3 bg-gray-400 rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-10 border border-gray-600">
        <SignIn.Root>
          <SignIn.Step name="start" className="">
            <div className="h-full w-full p-5">
              <h3 className="text-center text-2xl">Sign in to your account</h3>
              <Clerk.GlobalError className="block text-sm text-red-400" />
              <div className="my-4 flex gap-2 flex-col">
                <Clerk.Field
                  name="identifier"
                  className="w-full bg-gray-600 rounded-md px-4 py-1 my-2 group "
                >
                  <Clerk.Input
                    className="bg-transparent ring-0 border-none w-full focus-visible:ring-offset-0 focus-visible:ring-0 transition-all duration-100 text-sm py-1.5 focus:ring-0 focus:outline-none "
                    placeholder="Enter your Email"
                  />
                </Clerk.Field>
                <Clerk.Field
                  name="password"
                  className="w-full bg-gray-600 rounded-md px-4 py-1 my-2 group "
                >
                  <Clerk.Input
                    className="bg-transparent ring-0 border-none w-full focus-visible:ring-offset-0 focus-visible:ring-0 transition-all duration-100 text-sm py-1.5 focus:ring-0 focus:outline-none "
                    placeholder="Enter your Password"
                  />
                </Clerk.Field>
              </div>
              <div className="flex gap-2 w-full">
                <Clerk.Connection
                  name="google"
                  className="flex gap-2 bg-slate-900 p-2 w-full rounded-sm items-center justify-center cursor-pointer"
                >
                  <Image
                    src={"/google-icon.svg"}
                    width={20}
                    height={20}
                    alt="google-icon"
                  />
                  <p>Google</p>
                </Clerk.Connection>
                <Clerk.Connection
                  name="github"
                  className="flex justify-center gap-2 bg-slate-900/90 p-2 w-full rounded-sm"
                >
                  <Image
                    src={"/github-icon.svg"}
                    width={20}
                    height={20}
                    alt="github-icon"
                  />
                  <p>Github</p>
                </Clerk.Connection>
              </div>
              <SignIn.Action
                submit
                className="mt-5 w-full rounded-md bg-slate-950 px-3.5 py-2 text-center text-sm font-medium text-white shadow outline-none ring-1 ring-inset ring-zinc-950 hover:bg-zinc-800 focus-visible:outline-[1.5px] focus-visible:outline-offset-2 focus-visible:outline-zinc-950 active:text-white/70"
              >
                Sign In
              </SignIn.Action>
            </div>
          </SignIn.Step>
        </SignIn.Root>
      </div>
    </div>
  );
};

export default Page;
