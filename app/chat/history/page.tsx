"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  History,
  MessageSquare,
  FileText,
  Image,
  Video,
  Bot,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { redirect, useRouter } from "next/navigation";
import { getAllChats } from "@/app/action/chats";

const mockChatHistory = [
  {
    id: "1",
    type: "ai",
    title: "Project Planning Discussion",
    messages: 12,
    date: "2025-04-10T14:30:00",
    preview: "Let's discuss the project timeline and resource allocation...",
  },
  {
    id: "2",
    type: "documents",
    title: "Annual Report Analysis",
    messages: 8,
    date: "2025-04-09T10:15:00",
    preview:
      "I've analyzed the annual report and found several key insights...",
  },
  {
    id: "3",
    type: "images",
    title: "Product Design Review",
    messages: 15,
    date: "2025-04-08T16:45:00",
    preview:
      "The design looks great, but I suggest adjusting the color scheme...",
  },
  {
    id: "4",
    type: "videos",
    title: "Marketing Video Feedback",
    messages: 6,
    date: "2025-04-07T09:20:00",
    preview:
      "The video pacing is good, but the intro could be more engaging...",
  },
  {
    id: "5",
    type: "ai",
    title: "Brainstorming Session",
    messages: 20,
    date: "2025-04-06T13:10:00",
    preview: "Here are some creative ideas for the new campaign...",
  },
  {
    id: "6",
    type: "documents",
    title: "Contract Review",
    messages: 9,
    date: "2025-04-05T11:30:00",
    preview:
      "I've reviewed the contract and found several clauses that need attention...",
  },
];

export default function ChatHistory() {
  const [chatHistory, setChatHistory] = useState<any>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const filteredHistory =
    activeTab === "all"
      ? chatHistory
      : chatHistory.filter((chat: any) => chat.type === activeTab);

  const handleDeleteChat = (id: string) => {
    setChatToDelete(id);
    setDeleteDialogOpen(true);
  };

  const getData = async () => {
    const data = await getAllChats();
    setChatHistory(data);
  };

  useEffect(() => {
    getData();
  }, []);

  const redirectTOChat = (type: string, chatId: string) => {
    console.log(type);
    router.push(`/chat/${type.toLowerCase()}${type !== "AI" ? "s" : ""}`);
    sessionStorage.setItem(
      `${type.toLowerCase()}Session`,
      JSON.stringify({
        chatId,
      })
    );
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      setChatHistory(
        chatHistory.filter((chat: any) => chat.id !== chatToDelete)
      );
      toast({
        title: "Chat Deleted",
        description: "The chat has been permanently removed.",
      });
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "AI":
        return <Bot className="h-5 w-5 text-purple-500" />;
      case "DOCUMENT":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "IMAGE":
        return <Image className="h-5 w-5 text-emerald-500" />;
      case "VIDEO":
        return <Video className="h-5 w-5 text-orange-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "AI":
        return "bg-purple-500/10 text-purple-500";
      case "DOCUMENT":
        return "bg-blue-500/10 text-blue-500";
      case "IMAGE":
        return "bg-emerald-500/10 text-emerald-500";
      case "VIDEO":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col"
    >
      <div className="border-b p-8 bg-gradient-to-r from-indigo-500/10 via-primary/10 to-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-indigo-500/20">
              <History className="h-8 w-8 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-primary bg-clip-text text-transparent">
                Chat History
              </h1>
              <p className="text-muted-foreground mt-1">
                View and manage your previous conversations
              </p>
            </div>
          </div>

          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="all">
                <p>
                  All <span className="hidden md:inline">Chats</span>
                </p>
              </TabsTrigger>
              <TabsTrigger value="AI">
                AI <span className="hidden md:inline">Assistant</span>
              </TabsTrigger>
              <TabsTrigger value="DOCUMENT">
                Doc<span className="hidden md:inline">uments</span>
              </TabsTrigger>
              <TabsTrigger value="IMAGE">Images</TabsTrigger>
              <TabsTrigger value="VIDEO">Videos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No chat history found
            </h3>
            <p className="text-muted-foreground max-w-md">
              {activeTab === "all"
                ? "You haven't had any conversations yet. Start chatting to see your history here."
                : `You don't have any ${activeTab.toLocaleLowerCase()} chat history yet.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredHistory.map((chat: any) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="group"
              >
                <Card className="hover-card-effect h-full overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          getTypeColor(chat.type)
                        )}
                      >
                        {getTypeIcon(chat.type)}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteChat(chat.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                      {chat.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {chat.messages[0]?.content || "No messages exists"}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {Number(chat?._count.messages)} messages
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {/* {new Date(chat.date).toLocaleDateString()} */}
                      </span>
                    </div>
                  </div>
                  <div className="border-t p-4 bg-muted/30">
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      size="sm"
                      onClick={() => redirectTOChat(chat.type, chat.id)}
                    >
                      Continue Chat
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChatToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
