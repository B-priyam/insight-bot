"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Bot, User, Send, Paperclip } from "lucide-react";

interface Message {
  role: "user" | "system";
  content: string;
  timestamp?: Date;
}

interface Props {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  getResponse: () => Promise<void>;
}

export function ChatInterface({ messages, setMessages, getResponse }: Props) {
  const [input, setInput] = useState("");
  const latestMessageRef = useRef<Message | null>(null);
  const chatEndRef = useRef<any | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      const newMessage: Message = {
        role: "user",
        content: input,
        timestamp: new Date(Date.now()),
      };

      // Update the messages state
      setMessages((prev) => [...prev, newMessage]);
      setInput("");
    },
    [input, setMessages]
  );
  // Call getResponse whenever messages change
  useEffect(() => {
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "user" &&
      latestMessageRef.current !== messages[messages.length - 1]
    ) {
      latestMessageRef.current = messages[messages.length - 1];
      getResponse();
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <ScrollArea className="flex-1">
        <div className="space-y-4 px-2">
          {messages?.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Welcome to AI Chat!
              </h3>
              <p className="text-sm text-muted-foreground">
                Start a conversation with your AI assistant.
              </p>
            </div>
          )}
          {messages?.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <Card
                className={cn(
                  "max-w-[80%] p-4",
                  message.role === "system"
                    ? "glass-effect"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <div className="flex items-start gap-3">
                  {message.role === "system" && (
                    <Avatar className="h-8 w-8 bg-primary/20 items-center justify-center flex">
                      <Bot className="h-5 w-5 text-primary" />
                    </Avatar>
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className="text-xs opacity-70">
                      {/* {message?.timestamp?.toDateString()} */}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 bg-white/10 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </Avatar>
                  )}
                </div>
              </Card>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>
      <div className="pt-4">
        <Card className="p-2 m-1 shadow-2xl glass-effect">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none focus-visible:ring-0"
            />
            <Button type="submit" size="icon" className="shrink-0">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
