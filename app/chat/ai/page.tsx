"use client";

import Alert from "@/components/alert-dialog";
import { ChatInterface } from "@/components/chat/chat-interface";
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
import { getResponse } from "@/lib/chatWithAi";
import { getData } from "@/lib/retriveFromDatabase";
import { save, saveMessages } from "@/lib/saveToDatabase";
import { motion } from "framer-motion";
import { Bot, Loader2, MessageSquare, PlusIcon, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Message {
  role: "user" | "system";
  content: string;
  timestamp?: Date;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isMounted, setisMounted] = useState(false);
  const { toast } = useToast();
  const [allData, setAllData] = useState<any>();
  const [isSaved, setIsSaved] = useState(false);
  const [chatId, setchatId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [isTitleModelOpen, setIsTitleModelOpen] = useState(false);
  const [title, setTitle] = useState(
    `Untitled-${new Date().toLocaleDateString()}-${new Date().toLocaleTimeString()}`
  );

  useEffect(() => {
    setisMounted(true);
  }, []);

  const saveToDb = async () => {
    try {
      setSaving(true);
      const data = await save({ messages, title, type: "AI" });
      if (data) {
        sessionStorage.setItem("aiSession", JSON.stringify({ chatId: data }));
        setIsSaved(true);
        setchatId(data);
        setShowSaveButton(false);
        toast({
          title: "Session saved successfully",
          description: "All messages have been successfully saved.",
        });
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Error in saving session",
        description: "kindly try again .",
      });
    } finally {
      setSaving(false);
    }
  };

  const getNewChat = async () => {
    if (messages.length > 0) {
      const data = await getResponse(messages);
      setMessages((prev) => [...prev, data]);
      try {
        if (JSON.parse(sessionStorage?.getItem("aiSession")!)?.chatId) {
          await saveMessages(messages[messages.length - 1], data, chatId);
        }
      } catch (error) {
        setMessages((prev) => prev.filter((msg) => msg !== data));
      }
    }
  };

  useEffect(() => {
    if (
      messages.length > 0 &&
      !JSON.parse(sessionStorage.getItem("aiSession")!)?.chatId
    ) {
      sessionStorage.setItem(
        "aiSession",
        JSON.stringify({
          messages: messages,
        })
      );
      setShowSaveButton(true);
    }
  }, [messages]);

  useEffect(() => {
    if (
      JSON.parse(sessionStorage.getItem("aiSession")!)?.messages?.length > 0
    ) {
      setMessages(JSON.parse(sessionStorage.getItem("aiSession")!)?.messages);
    }
  }, []);

  const getMessagesData = async (chatId: string) => {
    try {
      const data = await getData(chatId);
      if (data) {
        setMessages(
          data?.messages?.map((message) => {
            return {
              content: message.content,
              role: message.role === "system" ? "system" : "user",
            };
          })
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (JSON.parse(sessionStorage.getItem("aiSession")!)?.chatId) {
      setchatId(JSON.parse(sessionStorage.getItem("aiSession")!)?.chatId);
      getMessagesData(JSON.parse(sessionStorage.getItem("aiSession")!)?.chatId);
    }
  }, []);

  const addNewChat = () => {
    setAllData(null), setIsSaved(false);
    setMessages([]);
    setchatId("");
    setShowSaveButton(false);
    // sessionStorage.setItem("aiSession", JSON.stringify({ update: true }));
    sessionStorage.removeItem("aiSession");
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
      <div className="border-b p-8 bg-gradient-to-r from-purple-500/10 via-primary/10 to-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-row justify-between mb-6">
            <div className="flex w-full items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Bot className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-primary bg-clip-text text-transparent">
                  AI Assistant
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
                    className="bg-purple-500/20 md:right-10  right-2 top-8"
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
            className={`p-2 bg-slate-900 justify-between mb-2 md:items-center ${
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
              <p className="text-sm text-muted-foreground">Ask me anything</p>
            </div>
          </div>
          <ChatInterface
            messages={messages}
            setMessages={setMessages}
            getResponse={getNewChat}
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
