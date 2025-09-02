// ChatGPT-like Responsive Chatbot UI (Frontend Only)
// Notes:
// - This is a self-contained React component using Tailwind + shadcn/ui + lucide-react + framer-motion.
// - It includes: New Chat, Search Chats, Library (pinned), and a main chat area with an input box.
// - Chats are persisted in localStorage. Replace fakeStream() with real backend calls when ready.
// - To wire a backend, see the sendMessageToBackend function at the bottom.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Menu,
  Send,
  Search as SearchIcon,
  Settings,
  MoreVertical,
  Star,
  StarOff,
  BookOpen,
  MessageSquare,
  Trash2,
  Edit3,
  Folder,
  History,
  Download,
} from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

// ---------- Types ----------
/** @typedef {{ id: string, role: 'user'|'assistant'|'system', content: string, createdAt: number }} Message */
/** @typedef {{ id: string, title: string, createdAt: number, updatedAt: number, pinned?: boolean, messages: Message[] }} Chat */

// ---------- Utilities ----------
const uid = () => Math.random().toString(36).slice(2);
const now = () => Date.now();
const key = "gptlike.chats.v1";

function save(chats) {
  localStorage.setItem(key, JSON.stringify(chats));
}
function load() {
  try {
    const raw = localStorage.getItem(key);
    return raw ? /** @type {Chat[]} */ (JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

const DEFAULT_SYSTEM_MESSAGE = {
  id: uid(),
  role: "system",
  content:
    "You are a helpful, concise assistant. Keep answers short unless asked for detail.",
  createdAt: now(),
};

// ---------- Root Component ----------
export default function ChatGPTLikeUI() {
  const [chats, setChats] = useState(/** @type {Chat[]} */ (load()));
  const [activeId, setActiveId] = useState(() => chats[0]?.id || "");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Ensure at least one chat exists
  useEffect(() => {
    if (chats.length === 0) {
      const first = createNewChat();
      setChats([first]);
      setActiveId(first.id);
    }
  }, []);

  // Persist
  useEffect(() => save(chats), [chats]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeId) || chats[0],
    [chats, activeId]
  );

  // Filtered list for search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [chats, query]);

  function createNewChat() {
    const id = uid();
    /** @type {Chat} */
    const chat = {
      id,
      title: "New chat",
      createdAt: now(),
      updatedAt: now(),
      pinned: false,
      messages: [DEFAULT_SYSTEM_MESSAGE],
    };
    return chat;
  }

  function handleNewChat() {
    const chat = createNewChat();
    setChats((prev) => [chat, ...prev]);
    setActiveId(chat.id);
    setMobileOpen(false);
  }

  function renameChat(id, title) {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, updatedAt: now() } : c))
    );
  }

  function deleteChat(id) {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) {
      const remain = chats.filter((c) => c.id !== id);
      const next = remain[0] || createNewChat();
      setChats(remain.length ? remain : [next]);
      setActiveId(next.id);
    }
  }

  function togglePin(id) {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  }

  function addMessage(role, content) {
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              updatedAt: now(),
              messages: [
                ...c.messages,
                { id: uid(), role, content, createdAt: now() },
              ],
            }
          : c
      )
    );
  }

  function updateLastAssistantChunk(chunk) {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChat.id) return c;
        const last = [...c.messages];
        const i = last.length - 1;
        if (i >= 0 && last[i].role === "assistant") {
          last[i] = { ...last[i], content: last[i].content + chunk };
        }
        return { ...c, messages: last, updatedAt: now() };
      })
    );
  }

  async function onSend() {
    const text = input.trim();
    if (!text || isStreaming) return;

    // user message
    addMessage("user", text);
    setInput("");

    // create assistant placeholder
    addMessage("assistant", "");

    setIsStreaming(true);

    try {
      // —— OPTION A: fake local stream (demo) ——
      for await (const chunk of fakeStream(text)) {
        updateLastAssistantChunk(chunk);
      }

      // —— OPTION B: real backend ——
      // await sendMessageToBackend(text, updateLastAssistantChunk);
    } catch (err) {
      updateLastAssistantChunk(
        "\n\n> ⚠ Error contacting the backend. Please try again."
      );
      console.error(err);
    } finally {
      setIsStreaming(false);
      // auto-set title from the first user message
      const current = chats.find((c) => c.id === activeChat.id);
      if (current && current.title === "New chat") {
        const firstUser = current.messages.find((m) => m.role === "user");
        if (firstUser) renameChat(current.id, truncate(firstUser.content, 40));
      }
    }
  }

  // Keyboard: Enter to send, Shift+Enter newline
  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="h-screen w-full bg-background text-foreground grid grid-rows-[auto_1fr_auto] md:grid-rows-1 md:grid-cols-[300px_1fr]">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex h-screen border-r flex-col">
        <Sidebar
          chats={chats}
          activeId={activeChat?.id}
          query={query}
          setQuery={setQuery}
          onNewChat={handleNewChat}
          onSelect={setActiveId}
          onDelete={deleteChat}
          onRename={renameChat}
          onTogglePin={togglePin}
        />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 border-b bg-background sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[85vw] sm:w-[360px]">
              <SheetHeader className="p-4">
                <SheetTitle className="text-left">Chats</SheetTitle>
              </SheetHeader>
              <Sidebar
                chats={chats}
                activeId={activeChat?.id}
                query={query}
                setQuery={setQuery}
                onNewChat={() => {
                  handleNewChat();
                  setMobileOpen(false);
                }}
                onSelect={(id) => {
                  setActiveId(id);
                  setMobileOpen(false);
                }}
                onDelete={deleteChat}
                onRename={renameChat}
                onTogglePin={togglePin}
                isMobile
              />
            </SheetContent>
          </Sheet>
          <div className="font-medium truncate max-w-[50vw]">
            {activeChat?.title || "New chat"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <TopbarMenu
            onRename={() => renameChat(activeChat.id, prompt("Rename chat:", activeChat.title) || activeChat.title)}
            onDelete={() => deleteChat(activeChat.id)}
          />
        </div>
      </div>

      {/* Main chat area */}
      <main className="flex flex-col h-[calc(100vh-48px)] md:h-screen">
        {/* Top bar (desktop) */}
        <div className="hidden md:flex items-center justify-between px-4 py-2 border-b">
          <div className="font-semibold text-base truncate">
            {activeChat?.title || "New chat"}
          </div>
          <div className="flex items-center gap-2">
            <ModelSelector />
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <TopbarMenu
              onRename={() => renameChat(activeChat.id, prompt("Rename chat:", activeChat.title) || activeChat.title)}
              onDelete={() => deleteChat(activeChat.id)}
            />
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-3 sm:px-6">
          <div className="mx-auto max-w-3xl py-4 sm:py-8">
            <AnimatePresence initial={false}>
              {activeChat?.messages
                .filter((m) => m.role !== "system")
                .map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="mb-4"
                  >
                    <MessageBubble role={msg.role} content={msg.content} timestamp={msg.createdAt} />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Composer */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="mx-auto max-w-3xl w-full">
            <div className="rounded-2xl border shadow-sm p-2 bg-background">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Message your assistant"
                className="min-h-[56px] max-h-[280px] resize-y border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Chat only UI</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" disabled={!isStreaming} onClick={() => setIsStreaming(false)}>
                    Stop
                  </Button>
                  <Button size="sm" onClick={onSend} disabled={!input.trim() || isStreaming}>
                    <Send className="h-4 w-4 mr-1" /> Send
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Your chats are saved locally in your browser. Connect your backend in <code>sendMessageToBackend()</code>.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------- Sidebar Component ----------
function Sidebar({ chats, activeId, onSelect, onNewChat, onDelete, onRename, onTogglePin, query, setQuery, isMobile }) {
  const pinned = chats.filter((c) => c.pinned);
  const others = chats.filter((c) => !c.pinned);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 flex gap-2">
        <Button className="w-full" onClick={onNewChat}>
          <Plus className="h-4 w-4 mr-2" /> New chat
        </Button>
      </div>
      <div className="px-3 pb-2">
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="pl-9"
          />
          <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="px-2 py-2 space-y-3">
          {/* Library / Pinned */}
          <div>
            <div className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" /> Library
            </div>
            {pinned.length === 0 ? (
              <div className="px-2 text-xs text-muted-foreground">No pinned chats</div>
            ) : (
              <div className="space-y-1">
                {pinned.map((c) => (
                  <ChatRow
                    key={c.id}
                    chat={c}
                    active={c.id === activeId}
                    onClick={() => onSelect(c.id)}
                    onDelete={() => onDelete(c.id)}
                    onRename={() => onRename(c.id, prompt("Rename chat:", c.title) || c.title)}
                    onTogglePin={() => onTogglePin(c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* All chats */}
          <div>
            <div className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5" /> All chats
            </div>
            {others.length === 0 ? (
              <div className="px-2 text-xs text-muted-foreground">No chats yet</div>
            ) : (
              <div className="space-y-1">
                {others.map((c) => (
                  <ChatRow
                    key={c.id}
                    chat={c}
                    active={c.id === activeId}
                    onClick={() => onSelect(c.id)}
                    onDelete={() => onDelete(c.id)}
                    onRename={() => onRename(c.id, prompt("Rename chat:", c.title) || c.title)}
                    onTogglePin={() => onTogglePin(c.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-3 grid grid-cols-2 gap-2 text-sm">
        <Button variant="secondary" className="w-full" onClick={() => exportChats(chats)}>
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
        <Button variant="outline" className="w-full">
          <History className="h-4 w-4 mr-2" /> History
        </Button>
      </div>
      <div className="p-3 pt-0 text-xs text-muted-foreground">
        {isMobile ? "" : "Built for demo • Frontend only"}
      </div>
    </div>
  );
}

function ChatRow({ chat, active, onClick, onDelete, onRename, onTogglePin }) {
  return (
    <div
      className={`group flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer border ${
        active ? "bg-accent border-accent" : "hover:bg-accent/50 border-transparent"
      }`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{chat.title}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {new Date(chat.updatedAt).toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
        >
          {chat.pinned ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel>Chat options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
              <Edit3 className="h-4 w-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(); }}>
              {chat.pinned ? <Star className="h-4 w-4 mr-2" /> : <StarOff className="h-4 w-4 mr-2" />} {chat.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ---------- Topbar ----------
function TopbarMenu({ onRename, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onRename}>
          <Edit3 className="h-4 w-4 mr-2" /> Rename chat
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete chat
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModelSelector() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <span className="text-xs">Model</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Choose model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>gpt-4o (UI only)</DropdownMenuItem>
        <DropdownMenuItem>gpt-4o-mini (UI only)</DropdownMenuItem>
        <DropdownMenuItem>gpt-5 (UI only)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------- Message Bubble ----------
function MessageBubble({ role, content, timestamp }) {
  const isUser = role === "user";
  return (
    <div className={flex gap-3 ${isUser ? "justify-end" : "justify-start"}}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl border px-3 py-2 text-sm leading-relaxed shadow-sm ${
          isUser ? "bg-primary text-primary-foreground" : "bg-card"
        }`}
      >
        <ReactMarkdown
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline ? (
                <pre className="mt-2 rounded-xl bg-muted p-3 overflow-x-auto text-xs" {...props}>
                  <code className={className}>{children}</code>
                </pre>
              ) : (
                <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
        <div className={mt-1 text-[10px] opacity-70 ${isUser ? "text-primary-foreground" : "text-muted-foreground"}}>
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// ---------- Helpers ----------
function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function download(filename, text) {
  const el = document.createElement("a");
  el.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  el.setAttribute("download", filename);
  el.style.display = "none";
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
}

function exportChats(chats) {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), chats }, null, 2);
  download(chats-${new Date().toISOString().slice(0,10)}.json, payload);
}

// Demo streaming generator
async function* fakeStream(prompt) {
  const reply = You said: ${prompt}\n\nThis is a demo UI. Replace the fake stream with your backend in the code.\n\n\\`\js\nconsole.log('Wire your /api/chat endpoint here');\n\\\`;
  const chunks = reply.match(/.{1,8}/g) || [reply];
  for (const c of chunks) {
    await new Promise((r) => setTimeout(r, 20));
    yield c;
  }
}

// Real backend call (example)
async function sendMessageToBackend(userText, onChunk) {
  // Example fetch to your backend SSE/stream endpoint
  // const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ message: userText }) });
  // const reader = res.body.getReader();
  // const decoder = new TextDecoder();
  // while (true) {
  //   const { value, done } = await reader.read();
  //   if (done) break;
  //   onChunk(decoder.decode(value));
  // }
  // return;
  throw new Error("sendMessageToBackend not implemented. Replace with your backend.");
}