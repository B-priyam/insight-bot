"use client";

import React from "react";
import { Input } from "../ui/input";
import { FormLabel } from "../ui/form";

type Props = {
  name: string;
  value: string;
  type: "text" | "password";
};

const CustomInput = () => {
  return (
    <div className="w-full bg-gray-600 rounded-md px-4 py-1 my-2 group">
      {/* <p className="text-sm group-focus-within:translate-y-2 transition-all">
        Email
      </p> */}
      <Input
        id="email"
        className="bg-transparent ring-0 border-none focus-visible:ring-offset-0 focus-visible:ring-0 transition-all duration-100"
        placeholder="Enter Your Email Id"
      />
    </div>
  );
};

export default CustomInput;
