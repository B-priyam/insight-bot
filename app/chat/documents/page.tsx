"use client";

import { retrieveDocuments } from "@/app/action/queryDocuments";
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
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FileText, Loader2, MessageSquare, PlusIcon, Save } from "lucide-react";
import { useEffect, useState } from "react";

interface Message {
  role: "user" | "system";
  content: string;
  timestamp?: Date;
  source?: string | null | undefined;
}

function DocumentsChat() {
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const [namespaceId, setNamespaceId] = useState<string>();
  const [allData, setAllData] = useState<any>();
  const [progress, setProgress] = useState<number>();
  const [processedFiles, setprocessedFiles] = useState([]);
  const [processing, setProcessing] = useState<boolean>();
  const [showSaveButton, setshowSaveButton] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
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

  const saveToDb = async () => {
    try {
      setSaving(true);
      let data;
      if (allData) {
        data = await save({ ...allData, title, type: "DOCUMENT" });
      } else {
        const sessionData = JSON.parse(
          sessionStorage.getItem("documentSession")!
        );
        data = await save({ ...sessionData, title, type: "DOCUMENT" });
      }
      console.log(data);
      if (data) {
        sessionStorage.setItem(
          "documentSession",
          JSON.stringify({ chatId: data })
        );
        setIsSaved(true);
        setChatId(data);
        setshowSaveButton(false);
        toast({
          title: "Session saved successfully",
          description: "All documents, messages have been successfully saved.",
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
      console.log("satrted");
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/cloudinary", {
        method: "POST",
        body: formData,
      });
      let data = await res.json();
      if (data) {
        setprocessedFiles(data);
        if (isSaved) {
          const datasaved = await saveDocuments(data, chatId);
          if (datasaved) {
            const status = JSON.parse(
              sessionStorage.getItem("documentSession")!
            );
            sessionStorage.setItem(
              "documentSession",
              JSON.stringify({
                chatId: chatId,
                updated: !status?.updated,
              })
            );
          }
        } else {
          const previousFiles = allData?.files || processedFiles;

          if (previousFiles && previousFiles.length > 0) {
            data = [...data, ...previousFiles];
          }

          const sessionData = {
            files: data,
            messages: messages,
            namespaceId: namespaceId || allData?.namespaceId,
            update: true,
          };
          sessionStorage.setItem(
            "documentSession",
            JSON.stringify(sessionData)
          );
        }
      }
    } catch (error) {
      console.error("Error processing documents:", error);
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing the documents.",
        variant: "destructive",
      });
    }
  };

  const processDocuments = async () => {
    if (!files || files.length < 1) {
      return toast({
        title: "No Documents found",
        description: "Kindly upload some files for processing.",
        variant: "destructive",
      });
    }
    setProcessing(true);
    setProgress(5);
    try {
      for (let i = 5; i < 40; i++) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      saveSession();
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      if (allData?.namespaceId || namespaceId) {
        formData.append(
          "namespaceId",
          allData ? allData?.namespaceId : namespaceId
        );
      }

      const res = await fetch("/api/document-upload", {
        method: "POST",
        body: formData,
      });
      for (let i = 40; i < 60; i++) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      const data = await res.json();
      console.log(data);

      if (data.namespaceId) {
        for (let i = 60; i < 80; i++) {
          setProgress(i);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        setNamespaceId(data?.namespaceId);
        setNamespaceId(data?.namespaceId);
        if (!namespaceId && !allData?.namespaceId) {
          sessionStorage.setItem(
            "documentSession",
            JSON.stringify({
              ...JSON.parse(sessionStorage.getItem("documentSession") || "{}"),
              namespaceId: data.namespaceId,
            })
          );
        }
        for (let i = 80; i <= 100; i++) {
          setProgress(i);
          await new Promise((resolve) => setInterval(resolve, 50));
        }
        toast({
          title: "Processing Complete",
          description: "All documents have been successfully processed .",
        });
        setProcessing(false);
        if (!isSaved) {
          setshowSaveButton(true);
        }
      } else {
        setProcessing(false);
        toast({
          title: "Processing Failed",
          description: "An error occurred while processing the documents.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing the documents.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const getDocuments = async (chatId: string) => {
    const data = await getData(chatId);
    if (data) {
      setAllData(data);
      setMessages(
        data?.messages?.map((message: any) => {
          return {
            content: message.content,
            role: message.role === "system" ? "system" : "user",
            timestamp: message?.timeStamp!,
          };
        })
      );
    }
  };

  useEffect(() => {
    const sessionData = sessionStorage.getItem("documentSession");
    if (sessionData) {
      const parsedSessionData = JSON.parse(sessionData);
      if (parsedSessionData?.chatId) {
        setChatId(parsedSessionData.chatId);
        setIsSaved(true);
        getDocuments(parsedSessionData.chatId);
      }
      if (parsedSessionData.files) {
        setshowSaveButton(true);
        setAllData(parsedSessionData);
        setMessages(parsedSessionData.messages);
        sessionStorage.setItem(
          "documentSession",
          JSON.stringify({ ...parsedSessionData, update: true })
        );
      }
    }
  }, []);

  const addNewChat = () => {
    setAllData(null), setFiles([]), setIsSaved(false);
    setMessages([]);
    setNamespaceId("");
    setChatId("");
    setshowSaveButton(false);
    sessionStorage.setItem("documentSession", JSON.stringify({ update: true }));
    // sessionStorage.removeItem("imageSession");
  };

  const getResponse = async () => {
    const data = await retrieveDocuments({
      namespaceId: allData?.namespaceId || namespaceId,
      chatHistory: messages,
      query: messages[messages.length - 1].content,
    });
    if (data) {
      setMessages((prev) => [...prev, data]);
      try {
        if (isSaved) {
          await saveMessages(messages[messages.length - 1], data, chatId);
        } else {
          const sessionData = sessionStorage.getItem("documentSession");
          const parsedSessionData = sessionData ? JSON.parse(sessionData) : {};
          const existingFiles = Array.isArray(parsedSessionData.files)
            ? parsedSessionData.files
            : [];
          const newFiles = Array.isArray(processedFiles) ? processedFiles : [];
          const allFiles = [...existingFiles, ...newFiles];

          const uniqueFiles = Array.from(
            new Map(allFiles.map((file) => [file.original_name, file])).values()
          );

          sessionStorage.setItem(
            "documentSession",
            JSON.stringify({
              files: uniqueFiles,
              namespaceId: allData?.namespaceId || namespaceId,
              messages: [...messages, data],
              update: false,
            })
          );
        }
      } catch (error) {
        console.log("error", error);
        setMessages((prev) => prev.filter((msg) => msg !== data));
      }
    }
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
      <div className="border-b p-8 bg-gradient-to-r from-blue-500/10 via-primary/10 to-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-row justify-between mb-6">
            <div className="flex w-full items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-primary bg-clip-text text-transparent">
                  Document Analysis
                </h1>
                <p className="text-muted-foreground mt-1">
                  Upload Documents and get AI-powered insights
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
                    className="bg-blue-500/10 md:right-10  right-2 top-8"
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
              type="document"
              accept={{
                "application/pdf": [".pdf"],
                "application/msword": [".doc"],
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                  [".docx"],
                "text/plain": [".txt"],
              }}
              onFilesSelected={setFiles}
              progress={progress}
              processing={processing}
              startProcessing={processDocuments}
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
                Ask questions about your documents
              </p>
            </div>
          </div>
          <div
            className={cn(
              (!allData?.files && processedFiles.length === 0 && !chatId) ||
                processing ||
                saving
                ? "touch-none pointer-events-none opacity-20 bg-opacity-20"
                : ""
            )}
          >
            <ChatInterface
              messages={messages}
              setMessages={setMessages}
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

export default DocumentsChat;
