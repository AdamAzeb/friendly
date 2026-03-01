"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, doc, getDoc, getDocs, addDoc, onSnapshot,
  query, orderBy, serverTimestamp, setDoc, arrayUnion, updateDoc,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useAuth } from "../../../../context/AuthContext";
import { saveAvailability, deleteAvailability, fetchGroupAvailability } from "../../../../lib/availabilityService";
import { getTopSuggestedSlots } from "../../../../lib/recommendationEngine";
import type { Message, Group, GroupMember, Session, AvailabilityBlock, SuggestedSlot } from "../../../../types";
import { ArrowLeft, Send, Plus, Trash2, Zap, CheckCircle, Copy, MessageCircle, Calendar, Sparkles } from "lucide-react";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const FULL_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
type Tab = "chat" | "availability" | "sessions";

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { user, profile } = useAuth();
  const router = useRouter();

  const [tab,     setTab]     = useState<Tab>("chat");
  const [group,   setGroup]   = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [myBlocks,  setMyBlocks]  = useState<AvailabilityBlock[]>([]);
  const [avDay,     setAvDay]     = useState(1);
  const [avStart,   setAvStart]   = useState("09:00");
  const [avEnd,     setAvEnd]     = useState("11:00");
  const [savingAv,  setSavingAv]  = useState(false);

  const [suggestions,       setSuggestions]       = useState<SuggestedSlot[]>([]);
  const [sessions,          setSessions]          = useState<Session[]>([]);
  const [loadingSuggestions,setLoadingSuggestions] = useState(false);

  useEffect(() => {
    async function load() {
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      if (!groupSnap.exists()) { router.push("/dashboard"); return; }
      setGroup({ id: groupSnap.id, ...groupSnap.data() } as Group);
      const memberSnap = await getDocs(collection(db, "groups", groupId, "members"));
      setMembers(memberSnap.docs.map(d => ({ uid: d.id, ...d.data() } as GroupMember)));
      setLoading(false);
    }
    load();
  }, [groupId, router]);

  useEffect(() => {
    const q = query(collection(db, "groups", groupId, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message))));
  }, [groupId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!user) return;
    getDocs(collection(db, "availability", user.uid, "blocks"))
      .then(snap => setMyBlocks(snap.docs.map(d => ({ userId: user!.uid, ...d.data() } as AvailabilityBlock))));
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "groups", groupId, "sessions"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Session))));
  }, [groupId]);

  async function sendMessage() {
    if (!text.trim() || !user || !profile) return;
    setSending(true);
    await addDoc(collection(db, "groups", groupId, "messages"), {
      senderId: user.uid, senderName: profile.name, text: text.trim(), timestamp: serverTimestamp(),
    });
    setText("");
    setSending(false);
  }

  async function addAvailability() {
    if (!user) return;
    if (avStart >= avEnd) { alert("End time must be after start time."); return; }
    setSavingAv(true);
    const block: Omit<AvailabilityBlock, "userId"> = { dayOfWeek: avDay, start: avStart, end: avEnd };
    await saveAvailability(user.uid, block);
    setMyBlocks(prev => [...prev.filter(b => !(b.dayOfWeek === avDay && b.start === avStart)), { userId: user.uid, ...block }]);
    setSavingAv(false);
  }

  async function removeBlock(block: AvailabilityBlock) {
    if (!user) return;
    await deleteAvailability(user.uid, block);
    setMyBlocks(prev => prev.filter(b => !(b.dayOfWeek === block.dayOfWeek && b.start === block.start)));
  }

  async function loadSuggestions() {
    setLoadingSuggestions(true);
    const allBlocks = await fetchGroupAvailability(members.map(m => m.uid));
    setSuggestions(getTopSuggestedSlots(allBlocks, members.map(m => m.uid)));
    setLoadingSuggestions(false);
  }

  async function proposeSession(slot: SuggestedSlot) {
    if (!user) return;
    await addDoc(collection(db, "groups", groupId, "sessions"), {
      dayOfWeek: slot.dayOfWeek, start: slot.start, end: slot.end,
      proposedBy: user.uid, rsvps: [user.uid], createdAt: serverTimestamp(),
    });
  }

  async function rsvp(session: Session) {
    if (!user) return;
    const sessionRef = doc(db, "groups", groupId, "sessions", session.id);
    const hasRsvp = session.rsvps.includes(user.uid);
    if (hasRsvp) {
      await updateDoc(sessionRef, { rsvps: session.rsvps.filter(id => id !== user.uid) });
    } else {
      await updateDoc(sessionRef, { rsvps: arrayUnion(user.uid) });
    }
  }

  function handleCopyCode() {
    if (group) {
      navigator.clipboard.writeText(group.inviteCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin" />
      </div>
    );
  }

  const TABS = [
    { id: "chat"         as Tab, label: "Chat",         Icon: MessageCircle },
    { id: "availability" as Tab, label: "Availability",  Icon: Calendar      },
    { id: "sessions"     as Tab, label: "Sessions",      Icon: Sparkles      },
  ];

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 80px)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 mb-2 transition-colors">
            <ArrowLeft size={12} /> Groups
          </button>
          <h1 className="text-xl font-bold text-white">{group?.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-white/30">{members.length} member{members.length !== 1 ? "s" : ""}</span>
            <span className="text-white/10">·</span>
            <button onClick={handleCopyCode} className="flex items-center gap-1 text-xs font-mono text-[#3B82F6]/70 hover:text-[#3B82F6] transition-colors">
              <Copy size={10} />
              {copied ? "Copied!" : group?.inviteCode}
            </button>
          </div>
        </div>
        <div className="flex -space-x-2">
          {members.slice(0, 5).map(m => (
            <div key={m.uid} title={m.name}
              className="w-8 h-8 rounded-full border-2 border-[#0D0D0F] bg-[#3B82F6]/20 flex items-center justify-center text-xs font-bold text-[#3B82F6]">
              {m.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {members.length > 5 && (
            <div className="w-8 h-8 rounded-full border-2 border-[#0D0D0F] bg-white/[0.06] flex items-center justify-center text-xs font-semibold text-white/40">
              +{members.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl shrink-0">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              tab === id ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-white/30 hover:text-white/60"
            }`}>
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ─── CHAT ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === "chat" && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle size={28} className="text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/25">No messages yet. Start the conversation.</p>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && <span className="text-[10px] text-white/25 px-1">{msg.senderName}</span>}
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
            <div className="flex gap-2 pt-3 shrink-0">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Message..."
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#3B82F6]/40 transition-colors"
              />
              <button onClick={sendMessage} disabled={sending || !text.trim()}
                className="w-10 h-10 bg-[#3B82F6] rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-[#2563EB] transition-colors shrink-0">
                <Send size={14} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── AVAILABILITY ─────────────────────────────────────────── */}
        {tab === "availability" && (
          <motion.div key="avail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto space-y-5">
            <div className="glass rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Add your availability</h2>
              <div className="space-y-2">
                <label className="text-xs text-white/30 font-medium">Day</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map((d, i) => (
                    <button key={d} onClick={() => setAvDay(i)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        avDay === i ? "bg-[#3B82F6] border-[#3B82F6] text-white" : "border-white/[0.08] text-white/40 hover:border-white/20"
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-white/30 font-medium">From</label>
                  <input type="time" value={avStart} onChange={e => setAvStart(e.target.value)} style={{ colorScheme: "dark" }}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3B82F6]/40 transition-colors" />
                </div>
                <span className="text-white/20 mt-4">→</span>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-white/30 font-medium">To</label>
                  <input type="time" value={avEnd} onChange={e => setAvEnd(e.target.value)} style={{ colorScheme: "dark" }}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3B82F6]/40 transition-colors" />
                </div>
              </div>
              <button onClick={addAvailability} disabled={savingAv}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#3B82F6] text-white text-sm font-semibold rounded-xl hover:bg-[#2563EB] disabled:opacity-50 transition-all">
                <Plus size={14} />
                {savingAv ? "Saving..." : "Add Block"}
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-white/60">Your availability</h2>
              {myBlocks.length === 0 ? (
                <p className="text-xs text-white/25 py-2">No blocks added yet</p>
              ) : (
                [...myBlocks].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.start.localeCompare(b.start)).map(b => (
                  <div key={`${b.dayOfWeek}-${b.start}`}
                    className="flex items-center justify-between glass rounded-xl px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-white">{FULL_DAYS[b.dayOfWeek]}</span>
                      <span className="text-sm text-white/35 ml-2">{b.start} – {b.end}</span>
                    </div>
                    <button onClick={() => removeBlock(b)} className="text-white/25 hover:text-[#3B82F6] transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ─── SESSIONS ─────────────────────────────────────────────── */}
        {tab === "sessions" && (
          <motion.div key="sessions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto space-y-5">
            <div className="glass rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Smart suggestions</h2>
                <p className="text-xs text-white/30 mt-0.5">Find the best times when everyone is free</p>
              </div>
              <button onClick={loadSuggestions} disabled={loadingSuggestions}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#3B82F6] text-white text-sm font-semibold rounded-xl hover:bg-[#2563EB] disabled:opacity-50 transition-all shadow-[0_0_16px_rgba(59,130,246,0.25)]">
                <Zap size={14} />
                {loadingSuggestions ? "Calculating..." : "Find Best Times"}
              </button>

              {suggestions.length > 0 && (
                <div className="space-y-2 pt-1">
                  {suggestions.map((slot, i) => (
                    <div key={`${slot.dayOfWeek}-${slot.start}`}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 border ${i === 0 ? "border-[#10B981]/30 bg-[#10B981]/[0.08]" : "border-white/[0.08] bg-white/[0.03]"}`}>
                      <div>
                        <span className="text-sm font-semibold text-white">{FULL_DAYS[slot.dayOfWeek]}</span>
                        <span className="text-sm text-white/40 ml-2">{slot.start} – {slot.end}</span>
                        <p className="text-xs mt-0.5" style={{ color: i === 0 ? "#10B981" : "rgba(255,255,255,0.3)" }}>
                          {slot.overlapCount} member{slot.overlapCount !== 1 ? "s" : ""} free
                          {i === 0 && " · Best slot"}
                        </p>
                      </div>
                      <button onClick={() => proposeSession(slot)}
                        className="px-3 py-1.5 bg-[#10B981] text-white text-xs font-semibold rounded-lg hover:bg-[#0ea472] transition-colors">
                        Propose
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {suggestions.length === 0 && !loadingSuggestions && (
                <p className="text-xs text-white/20 text-center">Add availability first, then find overlapping times</p>
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-white/60">Proposed sessions</h2>
              {sessions.length === 0 ? (
                <p className="text-xs text-white/25">No sessions proposed yet</p>
              ) : (
                sessions.map(session => {
                  const hasRsvp = user ? session.rsvps.includes(user.uid) : false;
                  return (
                    <div key={session.id} className="glass rounded-2xl px-4 py-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{FULL_DAYS[session.dayOfWeek]}</p>
                          <p className="text-sm text-white/40">{session.start} – {session.end}</p>
                        </div>
                        <button onClick={() => rsvp(session)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            hasRsvp
                              ? "bg-[#10B981] text-white"
                              : "border border-white/[0.1] text-white/50 hover:border-white/25 hover:text-white"
                          }`}>
                          {hasRsvp && <CheckCircle size={11} />}
                          {hasRsvp ? "Going" : "RSVP"}
                        </button>
                      </div>
                      <p className="text-xs text-white/25">{session.rsvps.length} going</p>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
