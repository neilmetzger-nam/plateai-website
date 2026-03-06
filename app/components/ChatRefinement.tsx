"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  promptAddition?: string;
}

const CREDITS_KEY = "plateai-chat-credits";
const INITIAL_CREDITS = 5;

function getCredits(): number {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem(CREDITS_KEY) : null;
    return s !== null ? parseInt(s) : INITIAL_CREDITS;
  } catch { return INITIAL_CREDITS; }
}

function setCredits(n: number) {
  localStorage.setItem(CREDITS_KEY, String(n));
}

export default function ChatRefinement() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [credits, setCreditsState] = useState(INITIAL_CREDITS);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! Tell me what you'd like to change — for example: \"make the broth richer\", \"the egg needs to face the camera\", or \"add more steam\". Each refinement costs 1 credit.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setCreditsState(getCredits()); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading || credits <= 0) return;
    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const newCredits = credits - 1;
      setCreditsState(newCredits);
      setCredits(newCredits);
      setMessages([...newMessages, {
        role: "assistant",
        content: data.message || "Sorry, I couldn't process that.",
        promptAddition: data.promptAddition || "",
      }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  // Only show on /generate routes
  if (!pathname.startsWith("/generate")) return null;

  function handleRegenerate(promptAddition: string) {
    if (credits <= 0) return;
    const newCredits = credits - 1;
    setCreditsState(newCredits);
    setCredits(newCredits);
    console.log("Regenerating with prompt addition:", promptAddition);
  }

  return (
    <>
      {/* Trigger */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!open && (
          <div className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400 shadow">
            1 credit per refinement
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 shadow-lg transition hover:bg-orange-600"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Photo Refinement</p>
              <p className="text-xs text-zinc-500">Plate<span className="text-orange-500">AI</span> Assistant</p>
            </div>
            <div className="flex items-center gap-3">
              {credits > 0 ? (
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-400">
                  {credits} credits
                </span>
              ) : (
                <a href="#pricing" onClick={() => setOpen(false)} className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-600">
                  Top up
                </a>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-orange-500 text-white"
                    : "bg-zinc-800 text-zinc-200"
                }`}>
                  <p>{m.content}</p>
                  {m.promptAddition && (
                    <>
                      <div className="mt-2 rounded-lg bg-zinc-700/60 p-2 font-mono text-xs text-zinc-300">
                        <p className="mb-1 text-zinc-500">Add to prompt:</p>
                        {m.promptAddition}
                      </div>
                      <button
                        onClick={() => handleRegenerate(m.promptAddition!)}
                        disabled={credits <= 0}
                        className="mt-2 w-full rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
                      >
                        Regenerate with this fix →
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-zinc-800 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "0ms" }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "150ms" }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 p-3">
            {credits <= 0 ? (
              <p className="text-center text-xs text-zinc-500">No credits left. <a href="#pricing" onClick={() => setOpen(false)} className="text-orange-400 hover:underline">Top up →</a></p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Describe what to change..."
                  className="flex-1 rounded-xl bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-orange-500"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  className="rounded-xl bg-orange-500 px-3 py-2 text-white transition hover:bg-orange-600 disabled:opacity-40"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
