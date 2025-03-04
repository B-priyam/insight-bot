"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Image,
  Video,
  MessageSquare,
  ArrowRight,
  Activity,
  Users,
  Zap,
  History,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { handleUserSignIn } from "./action/user";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      handleUserSignIn();
    }
  }, [isLoaded, isSignedIn]);
  useEffect(() => {
    if (!isSignedIn) {
      return redirect("/sign-in");
    }
  }, [isSignedIn]);
  return (
    <div className="gradient-bg min-h-screen row-span-1">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold mb-6 gradient-text">
            AI-Powered Chat Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the future of communication with our advanced AI chat
            platform. Upload documents, analyze images, process videos, and
            engage in intelligent conversations.
          </p>
        </div>

        <div className="stats-grid mb-16">
          <Card className="glass-effect p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-1">10M+</h3>
                <p className="text-muted-foreground">Messages Processed</p>
              </div>
            </div>
          </Card>
          <Card className="glass-effect p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-1">99.9%</h3>
                <p className="text-muted-foreground">Accuracy Rate</p>
              </div>
            </div>
          </Card>
          <Card className="glass-effect p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <Zap className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-1">24/7</h3>
                <p className="text-muted-foreground">Available Support</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Document Chat",
              description:
                "Upload and analyze documents with AI-powered insights",
              icon: FileText,
              href: "/chat/documents",
              color: "text-blue-500",
              bgColor: "bg-blue-500/10",
            },
            {
              title: "Image Analysis",
              description: "Process and understand images with advanced AI",
              icon: Image,
              href: "/chat/images",
              color: "text-emerald-500",
              bgColor: "bg-emerald-500/10",
            },
            {
              title: "Video Chat",
              description: "Extract insights from video content with AI",
              icon: Video,
              href: "/chat/videos",
              color: "text-orange-500",
              bgColor: "bg-orange-500/10",
            },
            {
              title: "AI Assistant",
              description: "Engage in intelligent conversations with our AI",
              icon: MessageSquare,
              href: "/chat/ai",
              color: "text-purple-500",
              bgColor: "bg-purple-500/10",
            },
            // {
            //   title: "Chat History",
            //   description: "View and manage your previous conversations",
            //   icon: History,
            //   href: "/chat/history",
            //   color: "text-indigo-500",
            //   bgColor: "bg-indigo-500/10",
            // },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <Card className="hover-card-effect h-full card-gradient p-6">
                <div
                  className={cn(
                    "mb-6 flex h-14 w-14 items-center justify-center rounded-full",
                    item.bgColor
                  )}
                >
                  <item.icon className={cn("h-7 w-7", item.color)} />
                </div>
                <h2 className="text-2xl font-semibold mb-3">{item.title}</h2>
                <p className="text-muted-foreground mb-6">{item.description}</p>
                <Button variant="secondary" className="group w-full">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
