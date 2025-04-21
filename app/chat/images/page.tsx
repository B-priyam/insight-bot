"use client";

import { queryPinecone } from "@/app/action/queryPinecone";
import Alert from "@/components/alert-dialog";
import { ChatInterface } from "@/components/chat/chat-interface";
import FileUpload from "@/components/file-upload";
import { DialogDemo } from "@/components/title-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getImageResponse } from "@/lib/chatWithImage";
import { getData } from "@/lib/retriveFromDatabase";
import { save, saveDocuments, saveMessages } from "@/lib/saveToDatabase";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Image, Loader2, MessageSquare, PlusIcon, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Message {
  role: "user" | "system";
  content: string;
  timestamp?: Date;
}

export default function ImagesChat() {
  const [images, setImages] = useState<File[]>([]);
  const [processedImages, setprocessedImages] = useState([]);
  const [messages, setmessages] = useState<Message[]>([]);
  const [namespaceId, setNamespaceId] = useState("");
  const [showSaveButton, setshowSaveButton] = useState<boolean>(false);
  const { toast } = useToast();
  const [allData, setAllData] = useState<any>();
  const [isSaved, setIsSaved] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [chatId, setchatId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [isTitleModelOpen, setIsTitleModelOpen] = useState(false);
  const [title, setTitle] = useState(
    `Untitled-${new Date().toLocaleDateString()}-${new Date().toLocaleTimeString()}`
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const saveToDb = async () => {
    try {
      setSaving(true);
      let data;
      if (allData) {
        data = await save({ ...allData, title, type: "IMAGE" });
      } else {
        const sessionData = JSON.parse(sessionStorage.getItem("imageSession")!);
        data = await save({ ...sessionData, title, type: "IMAGE" });
      }
      console.log(data);
      if (data) {
        sessionStorage.setItem(
          "imageSession",
          JSON.stringify({ chatId: data })
        );
        setIsSaved(true);
        setchatId(data);
        setshowSaveButton(false);
        toast({
          title: "Session saved successfully",
          description: "All images, messages have been successfully saved.",
        });
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Error in saving file",
        description: "kindly try again .",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSession = async () => {
    try {
      const formData = new FormData();
      images.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/cloudinary", {
        method: "POST",
        body: formData,
      });
      let data = await res.json();
      if (data) {
        setprocessedImages(data);
        if (isSaved) {
          const datasaved = await saveDocuments(data, chatId);
          if (datasaved) {
            const status = JSON.parse(sessionStorage.getItem("imageSession")!);
            sessionStorage.setItem(
              "imageSession",
              JSON.stringify({
                chatId: chatId,
                updated: !status?.updated,
              })
            );
          }
        } else {
          const previousFiles = allData?.files || processedImages;

          if (previousFiles && previousFiles.length > 0) {
            data = [...data, ...previousFiles];
          }

          const sessionData = {
            files: data,
            messages: messages,
            namespaceId: namespaceId || allData?.namespaceId,
            update: true,
          };
          sessionStorage.setItem("imageSession", JSON.stringify(sessionData));
        }
      }
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing the images.",
        variant: "destructive",
      });
    }
  };

  async function uploadAndAnalyzeImages() {
    try {
      if (!images || images.length < 1) {
        return toast({
          title: "No image found",
          description: "Kindly upload some images for processing.",
          variant: "destructive",
        });
      }
      saveSession();
      setProcessing(true);

      for (let i = 0; i < 50; i++) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const formData = new FormData();
      images.forEach((file) => formData.append("files", file));
      if (allData?.namespaceId || namespaceId) {
        formData.append(
          "namespaceId",
          allData ? allData?.namespaceId : namespaceId
        );
      }
      const res = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      for (let i = 50; i <= 80; i++) {
        setProgress(i);
        await new Promise((resolve) => setInterval(resolve, 50));
      }

      const data = await res.json();

      if (data.namespaceId) {
        for (let i = 80; i < 100; i++) {
          setProgress(i);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        setNamespaceId(data?.namespaceId);
        if (!namespaceId && !allData?.namespaceId) {
          sessionStorage.setItem(
            "imageSession",
            JSON.stringify({
              ...JSON.parse(sessionStorage.getItem("imageSession") || "{}"),
              namespaceId: data.namespaceId,
            })
          );
        }
        setProcessing(false);
        toast({
          title: "Processing Complete",
          description: "All images have been successfully processed .",
        });
        if (!isSaved) {
          setshowSaveButton(true);
        }
      } else {
        setProcessing(false);
        toast({
          title: "Error in Processing",
          description: "Kindly try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error in Processing",
        description: "Kindly try again.",
      });
      setProcessing(false);
    }
  }

  const getImageData = async (chatId: string) => {
    const data = await getData(chatId);
    if (data) {
      console.log(data);
      setAllData(data);
      setmessages(
        data?.messages?.map((message: any) => {
          return {
            content: message.content,
            role: message.role === "system" ? "system" : "user",
            timestamp: message.timeStamp!,
          };
        })
      );
    }
  };

  useEffect(() => {
    const sessionData = sessionStorage.getItem("imageSession");
    if (sessionData) {
      const parsedSessionData = JSON.parse(sessionData);
      if (parsedSessionData?.chatId) {
        setchatId(parsedSessionData.chatId);
        setIsSaved(true);
        getImageData(parsedSessionData.chatId);
      }
      if (parsedSessionData.files) {
        setshowSaveButton(true);
        setAllData(parsedSessionData);
        setmessages(parsedSessionData.messages);
        sessionStorage.setItem(
          "imageSession",
          JSON.stringify({ ...parsedSessionData, update: true })
        );
      }
    }
  }, []);

  const getResponse = async () => {
    const res = await queryPinecone({
      namespaceId: allData ? allData.namespaceId : namespaceId,
      chatHistory: messages,
      query: messages[messages.length - 1].content,
    });
    if (res) {
      setmessages((prev) => [...prev, res]);
      try {
        if (isSaved) {
          await saveMessages(messages[messages.length - 1], res, chatId);
        } else {
          const sessionData = sessionStorage.getItem("imageSession");
          const parsedSessionData = sessionData ? JSON.parse(sessionData) : {};
          const existingFiles = Array.isArray(parsedSessionData.files)
            ? parsedSessionData.files
            : [];
          const newFiles = Array.isArray(processedImages)
            ? processedImages
            : [];
          const allFiles = [...existingFiles, ...newFiles];

          const uniqueFiles = Array.from(
            new Map(allFiles.map((file) => [file.original_name, file])).values()
          );

          sessionStorage.setItem(
            "imageSession",
            JSON.stringify({
              files: uniqueFiles,
              namespaceId: allData?.namespaceId || namespaceId,
              messages: [...messages, res],
              update: false,
            })
          );
        }
      } catch (error) {
        console.log("error", error);
        setmessages((prev) => prev.filter((msg) => msg !== res));
      }
    }
  };

  const addNewChat = () => {
    setAllData(null), setImages([]), setIsSaved(false);
    setmessages([]);
    setNamespaceId("");
    setchatId("");
    setshowSaveButton(false);
    sessionStorage.setItem("imageSession", JSON.stringify({ update: true }));
    // sessionStorage.removeItem("imageSession");
  };

  if (!isMounted) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col"
    >
      <div className="border-b p-8 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-row justify-between mb-6">
            <div className="flex w-full items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <Image className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-primary bg-clip-text text-transparent">
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
                  <Button
                    onClick={() => {
                      !isSaved ? setOpenAlertDialog(true) : addNewChat();
                    }}
                    className="bg-emerald-500/10 md:right-10  right-2 top-8"
                  >
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
              onClick={() => setIsTitleModelOpen(true)}
              className="bg-slate-800 hover:bg-slate-800/50"
            >
              {saving ? (
                <div className="flex flex-row gap-2">
                  <Loader2 className="animate-spin" />
                  {"saving"}
                </div>
              ) : (
                "Save file"
              )}
            </Button>
          </Card>
          <Card className="p-6 glass-effect">
            <FileUpload
              type="image"
              accept={{
                "image/*": [".png", ".jpg", ".jpeg", ".gif"],
              }}
              onFilesSelected={setImages}
              startProcessing={uploadAndAnalyzeImages}
              processing={processing}
              progress={progress}
            />
          </Card>
        </div>
      </div>

      <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
        {/* {!processing && !saving && ( */}
        <Card className="glass-effect h-full overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Chat Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Ask questions about your images
              </p>
            </div>
          </div>
          <div
            className={cn(
              (!allData?.files && processedImages.length === 0 && !chatId) ||
                processing ||
                saving
                ? "touch-none pointer-events-none opacity-20 bg-opacity-20"
                : ""
            )}
          >
            <ChatInterface
              messages={messages}
              setMessages={setmessages}
              getResponse={getResponse}
            />
          </div>
        </Card>
        <div>
          <Alert
            addNewChat={addNewChat}
            openAlertDialog={openAlertDialog}
            setOpenAlertDialog={setOpenAlertDialog}
          />
        </div>
        <div>
          <DialogDemo
            isTitleModelOpen={isTitleModelOpen}
            setIsTitleModelOpen={setIsTitleModelOpen}
            setTitle={setTitle}
            title={title}
            action={saveToDb}
          />
        </div>
      </div>
    </motion.div>
  );
}
