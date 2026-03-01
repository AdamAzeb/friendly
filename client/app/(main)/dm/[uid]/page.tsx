"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, getDoc, doc,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useAuth } from "../../../../context/AuthContext";
import type { Message } from "../../../../types";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";

export default function DMPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid: theirUid } = use(params);
  const { user, profile } = useAuth();
  const router = useRouter();

  const [theirName, setTheirName] = useState("...");
  const [messages, setMessages]   = useState<Message[]>([]);
  const [text, setText]           = useState("");
  const [sending, setSending]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // convoId is always the two UIDs sorted so both sides get same path
  const convoId = user ? [user.uid, theirUid].sort().join("_") : null;

  // Fetch other user's name
  useEffect(() => {
    getDoc(doc(db, "users", theirUid)).then(snap => {
      if (snap.exists()) setTheirName((snap.data().name as string) || "Friend");
    });
  }, [theirUid]);

  // Subscribe to messages
  useEffect(() => {
    if (!convoId) return;
    const q = query(
      collection(db, "dms", convoId, "messages"),
      orderBy("timestamp", "asc")
    );
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
  }, [convoId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim() || !user || !profile || !convoId) return;
    setSending(true);
    await addDoc(collection(db, "dms", convoId, "messages"), {
      senderId:   user.uid,
      senderName: profile.name,
      text:       text.trim(),
      timestamp:  serverTimestamp(),
    });
    setText("");
    setSending(false);
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 80px)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06] shrink-0 mb-4">
        <button
          onClick={() => router.push("/friends")}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors shrink-0"
        >
          <ArrowLeft size={13} />
          <span className="hidden sm:inline">Friends</span>
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#3B82F6]/15 flex items-center justify-center text-xs font-bold text-[#3B82F6]">
            {theirName !== "..." ? theirName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{theirName}</p>
            <p className="text-[10px] text-white/25">Direct message</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-3 text-center py-12"
          >
            <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center">
              <MessageSquare size={18} className="text-white/20" />
            </div>
            <p className="text-sm text-white/25">Start a conversation with {theirName}</p>
          </motion.div>
        )}

        {messages.map(msg => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-[#3B82F6] text-white rounded-tr-sm"
                    : "bg-white/[0.07] text-white/85 rounded-tl-sm border border-white/[0.06]"
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 shrink-0">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={`Message ${theirName === "..." ? "..." : theirName}...`}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#3B82F6]/40 transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !text.trim()}
          className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-[#2563EB] transition-colors shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}
