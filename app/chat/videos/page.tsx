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
import { getData } from "@/lib/retriveFromDatabase";
import { save, saveDocuments, saveMessages } from "@/lib/saveToDatabase";
import { motion } from "framer-motion";
import { Video, MessageSquare, PlusIcon, Save, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Message {
  role: "user" | "system";
  content: string;
  timestamp?: Date;
}

export default function VideosChat() {
  const [videos, setVideos] = useState<File[]>([]);
  const [showSaveButton, setshowSaveButton] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [uploadedVideos, setUploadedVideos] = useState<any>([]);
  const [namespaceId, setNamespaceId] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [allData, setAllData] = useState<any>([]);
  const [processedVideos, setProcessedVideos] = useState([]);
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [isTitleModelOpen, setIsTitleModelOpen] = useState(false);
  const [title, setTitle] = useState(
    `Untitled-${new Date().toLocaleDateString()}-${new Date().toLocaleTimeString()}`
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { toast } = useToast();

  const saveToDb = async () => {
    try {
      setSaving(true);
      let data;
      if (allData) {
        data = await save({ ...allData, title, type: "VIDEO" });
      } else {
        const sessionData = JSON.parse(sessionStorage.getItem("videoSession")!);
        console.log("sessiondata", sessionData);
        data = await save({ ...sessionData, title, type: "VIDEO" });
      }
      if (data) {
        sessionStorage.setItem(
          "videoSession",
          JSON.stringify({ chatId: data })
        );
        setIsSaved(true);
        setChatId(data);
        setshowSaveButton(false);
        toast({
          title: "Session saved successfully",
          description: "All videos, messages have been successfully saved.",
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
      videos.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/cloudinary", {
        method: "POST",
        body: formData,
      });
      let data = await res.json();
      if (data) {
        setProcessedVideos(data);
        if (isSaved) {
          const datasaved = await saveDocuments(data, chatId);
          if (datasaved) {
            const status = JSON.parse(sessionStorage.getItem("videoSession")!);
            sessionStorage.setItem(
              "videoSession",
              JSON.stringify({
                chatId: chatId,
                updated: !status?.updated,
              })
            );
          }
        } else {
          const previousFiles = allData?.files || processedVideos;

          if (previousFiles && previousFiles.length > 0) {
            data = [...data, ...previousFiles];
          }

          sessionStorage.setItem(
            "videoSession",
            JSON.stringify({
              ...JSON.parse(sessionStorage.getItem("videoSession") || "{}"),
              files: data,
              messages: messages,
              update: true,
            })
          );
        }
      }
    } catch (error) {
      console.error("Error processing videos:", error);
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing the videos.",
        variant: "destructive",
      });
    }
  };

  async function uploadAndAnalyzeVideos() {
    try {
      if (!videos || videos.length < 1) {
        return toast({
          title: "No image found",
          description: "Kindly upload some videos for processing.",
          variant: "destructive",
        });
      }
      let larger = false;
      videos.forEach((video) => {
        if (video.size > 30605401) {
          larger = true;
          return toast({
            title: "video size too large",
            description: "kindly upload videos under 30Mb",
          });
        }
      });
      // if (larger) return
      setProcessing(true);

      for (let i = 0; i < 50; i++) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      saveSession();
      const formData = new FormData();
      videos.forEach((file) => formData.append("files", file));
      if (allData?.namespaceId || namespaceId) {
        formData.append(
          "namespaceId",
          allData ? allData?.namespaceId : namespaceId
        );
      }
      const res = await fetch("/api/video-upload", {
        method: "POST",
        body: formData,
      });

      // const formData2 = new FormData();
      // formData2.append("file", videos[0]);
      // formData2.append("target_size_mb", "25");

      // const datas = await fetch("http://127.0.0.1:8000/compress/", {
      //   method: "POST",
      //   body: formData2,
      // });

      // console.log(datas);
      const data = await res.json();

      if (data.namespaceId) {
        for (let i = 50; i < 80; i++) {
          setProgress(i);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        console.log(data);
        setNamespaceId(data?.namespaceId);
        if (!namespaceId && !allData?.namespaceId) {
          sessionStorage.setItem(
            "videoSession",
            JSON.stringify({
              ...JSON.parse(sessionStorage.getItem("videoSession") || "{}"),
              namespaceId: data.namespaceId,
            })
          );
        }
        setProcessing(false);
        toast({
          title: "Processing Complete",
          description: "All videos have been successfully processed .",
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
      setMessages(
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
    const sessionData = sessionStorage.getItem("videoSession");
    if (sessionData) {
      const parsedSessionData = JSON.parse(sessionData);
      if (parsedSessionData?.chatId) {
        setChatId(parsedSessionData.chatId);
        setIsSaved(true);
        getImageData(parsedSessionData.chatId);
      }
      if (parsedSessionData.files) {
        setshowSaveButton(true);
        setAllData(parsedSessionData);
        setMessages(parsedSessionData.messages);
        sessionStorage.setItem(
          "videoSession",
          JSON.stringify({ ...parsedSessionData, update: true })
        );
      }
    }
  }, []);

  const getResponse = async () => {
    const res = await queryPinecone({
      namespaceId: namespaceId || allData?.namespaceId,
      chatHistory: messages,
      query: messages[messages.length - 1].content,
    });
    if (res) {
      setMessages((prev) => [...prev, res]);
      try {
        if (isSaved) {
          await saveMessages(messages[messages.length - 1], res, chatId);
        } else {
          const sessionData = sessionStorage.getItem("videoSession");
          const parsedSessionData = sessionData ? JSON.parse(sessionData) : {};
          const existingFiles = Array.isArray(parsedSessionData.files)
            ? parsedSessionData.files
            : [];
          const newFiles = Array.isArray(processedVideos)
            ? processedVideos
            : [];
          const allFiles = [...existingFiles, ...newFiles];

          const uniqueFiles = Array.from(
            new Map(allFiles.map((file) => [file.original_name, file])).values()
          );

          sessionStorage.setItem(
            "videoSession",
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
        setMessages((prev) => prev.filter((msg) => msg !== res));
      }
    }
  };

  const addNewChat = () => {
    setAllData(null), setVideos([]), setIsSaved(false);
    setMessages([]);
    setNamespaceId("");
    setChatId("");
    setshowSaveButton(false);
    sessionStorage.setItem("videoSession", JSON.stringify({ update: true }));
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
      <div className="border-b p-8 bg-gradient-to-r from-orange-500/10 via-primary/10 to-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-row justify-between mb-6">
            <div className="flex w-full items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/20">
                <Video className="h-8 w-8 text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-primary bg-clip-text text-transparent">
                  Video Analysis
                </h1>
                <p className="text-muted-foreground mt-1">
                  Upload videos and get AI-powered insights
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
                    className="bg-orange-500/20 md:right-10  right-2 top-8"
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
              type="video"
              accept={{
                "video/*": [".mp4", ".webm", ".ogg"],
              }}
              onFilesSelected={setVideos}
              startProcessing={uploadAndAnalyzeVideos}
              processing={processing}
              progress={progress}
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
          <ChatInterface
            getResponse={getResponse}
            messages={messages}
            setMessages={setMessages}
          />
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
