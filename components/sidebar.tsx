"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Video,
  MessageSquare,
  Menu,
  Settings,
  Search,
  Bell,
  ImageIcon,
  LogOut,
  History,
} from "lucide-react";
import Link from "next/link";
import {
  redirect,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ui/theme-toggle";
import { Input } from "./ui/input";
import { Avatar } from "./ui/avatar";
import { SignedOut, SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";

const routes = [
  {
    label: "Document Chat",
    icon: FileText,
    href: "/chat/documents",
    color: "text-blue-500",
  },
  {
    label: "Image Analysis",
    icon: ImageIcon,
    href: "/chat/images",
    color: "text-emerald-500",
  },
  {
    label: "Video Chat",
    icon: Video,
    href: "/chat/videos",
    color: "text-orange-500",
  },
  {
    label: "AI Assistant",
    icon: MessageSquare,
    href: "/chat/ai",
    color: "text-purple-500",
  },
  {
    label: "Chat History",
    icon: History,
    href: "/chat/history",
    color: "text-indigo-500",
  },
];

export function Sidebar() {
  const { user } = useUser();
  const pathName = usePathname();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsMobileOpen]);

  const logOut = () => {
    router.push("/sign-in");
  };

  return (
    <div
      className={`${
        (pathName === "/sign-in" && "hidden") ||
        (pathName === "/sign-up" && "hidden")
      }`}
    >
      <Button
        variant="ghost"
        size="icon"
        className={`md:hidden fixed top-1 left-0 z-50 ${
          isMobileOpen && "hidden"
        }`}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      <div
        ref={sidebarRef}
        className={cn(
          "fixed inset-y-0 z-40 flex h-full w-72 flex-col sidebar transition-transform duration-300 md:relative md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 cursor-pointer" onClick={() => redirect("/")}>
            <h2 className="text-2xl font-bold gradient-text mb-6 flex flex-row justify-between items-center">
              AI Assistant
              <ThemeToggle />
            </h2>
            {/* <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 search-input" />
            </div> */}
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2">
              {routes.map((route) => (
                <Link
                  onClick={() => setIsMobileOpen(false)}
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "nav-item",
                    pathname === route.href && "active"
                  )}
                >
                  <route.icon className={cn("h-5 w-5", route.color)} />
                  {route.label}
                </Link>
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-border mt-auto">
            <div className="flex items-center justify-between mb-4">
              {/* <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button> */}
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <Image
                  src={user?.imageUrl!}
                  fill
                  className="rounded-full object-cover"
                  alt="user"
                />
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{`${user?.firstName} ${user?.lastName}`}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <SignOutButton redirectUrl="/sign-in">
                <LogOut onClick={logOut} className="cursor-pointer " />
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
