"use client";

import { ChatInterface } from "@/components/chat/chat-interface";
import FileUpload from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Video, MessageSquare, PlusIcon, Save } from "lucide-react";
import { useState } from "react";

export default function VideosChat() {
  const [videos, setVideos] = useState<File[]>([]);
  const [showSaveButton, setshowSaveButton] = useState(false);

  const analyseVideos = async () => {
    console.log("started");
    const formData = new FormData();

    videos.forEach((video) => formData.append("files", video));

    const res = await fetch("/api/video-upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col"
    >
      <div className="border-b p-8 bg-gradient-to-r from-orange-500/10 via-primary/10 to-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-row justify-between mb-6">
            <div className="flex w-full items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/20">
                <Video className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-primary bg-clip-text text-transparent">
                  Image Analysis
                </h1>
                <p className="text-muted-foreground mt-1">
                  Upload images and get AI-powered insights
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button className="bg-orange-500/20 md:right-10  right-2 top-8">
                    <PlusIcon />
                    <p className="hidden md:flex">New Chat</p>
                  </Button>
                  <TooltipContent alignOffset={100} align="center" side="left">
                    Start new chat
                  </TooltipContent>
                </TooltipTrigger>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Card
            className={`p-2 bg-slate-900 justify-between mb-2 ${
              showSaveButton ? "flex" : "hidden"
            }`}
            style={{ display: showSaveButton ? "flex" : "none" }}
          >
            <div className="flex flex-row gap-2">
              <Save className="mt-1 hidden md:flex" />
              <div className="flex flex-col">
                <h3 className="text-slate-200">Save This file ?</h3>
                <p className="text-xs text-slate-500">
                  Save this file to avoid losing your chats. Avoid saving files
                  that may not be required in future.
                </p>
              </div>
            </div>
            <Button
              // onClick={saveToDb}
              className="bg-slate-800 hover:bg-slate-800/50"
            >
              Save file
            </Button>
          </Card>
          <Card className="p-6 glass-effect">
            <FileUpload
              type="video"
              accept={{
                "video/*": [".mp4", ".webm", ".ogg"],
              }}
              onFilesSelected={setVideos}
              startProcessing={analyseVideos}
            />
          </Card>
        </div>
      </div>

      <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <Card className="glass-effect h-full overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Chat Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Ask questions about your videos
              </p>
            </div>
          </div>
          {/* <ChatInterface /> */}
        </Card>
      </div>
    </motion.div>
  );
}
