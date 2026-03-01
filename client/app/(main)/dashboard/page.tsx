"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, addDoc, doc, setDoc, getDoc, getDocs,
  serverTimestamp, arrayUnion, updateDoc, query, where,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import type { Group } from "../../../types";
import { Users, Plus, Hash, ArrowRight, X, ChevronRight } from "lucide-react";

type Modal = "create" | "join" | null;

export default function DashboardPage() {
  const { user, profile, updateProfile } = useAuth();
  const router = useRouter();

  const [groups,        setGroups]        = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [modal,         setModal]         = useState<Modal>(null);
  const [groupName,     setGroupName]     = useState("");
  const [inviteCode,    setInviteCode]    = useState("");
  const [busy,          setBusy]          = useState(false);
  const [error,         setError]         = useState("");

  useEffect(() => {
    if (!profile?.groupIds || profile.groupIds.length === 0) {
      setLoadingGroups(false);
      return;
    }
    async function fetchGroups() {
      const fetched: Group[] = [];
      await Promise.all(
        (profile!.groupIds ?? []).map(async (gid) => {
          const snap = await getDoc(doc(db, "groups", gid));
          if (snap.exists()) fetched.push({ id: snap.id, ...snap.data() } as Group);
        })
      );
      setGroups(fetched);
      setLoadingGroups(false);
    }
    fetchGroups();
  }, [profile?.groupIds]);

  function openModal(m: Modal) {
    setModal(m);
    setError("");
    setGroupName("");
    setInviteCode("");
  }

  async function handleCreate() {
    if (!groupName.trim()) { setError("Enter a group name."); return; }
    if (!user || !profile) return;
    setBusy(true);
    setError("");
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const ref = await addDoc(collection(db, "groups"), {
        name: groupName.trim(),
        createdBy: user.uid,
        inviteCode: code,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "groups", ref.id, "members", user.uid), {
        name: profile.name,
        joinedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid), { groupIds: arrayUnion(ref.id) });
      await updateProfile({ groupIds: [...(profile.groupIds ?? []), ref.id] });
      setModal(null);
      router.push(`/group/${ref.id}`);
    } catch {
      setError("Something went wrong. Try again.");
    }
    setBusy(false);
  }

  async function handleJoin() {
    const code = inviteCode.trim().toUpperCase();
    if (!code) { setError("Enter an invite code."); return; }
    if (!user || !profile) return;
    setBusy(true);
    setError("");
    try {
      const q = query(collection(db, "groups"), where("inviteCode", "==", code));
      const snap = await getDocs(q);
      if (snap.empty) { setError("No group found with that code."); setBusy(false); return; }
      const groupDoc = snap.docs[0];
      const groupId = groupDoc.id;
      const memberSnap = await getDoc(doc(db, "groups", groupId, "members", user.uid));
      if (memberSnap.exists()) { setError("You're already in that group."); setBusy(false); return; }
      await setDoc(doc(db, "groups", groupId, "members", user.uid), {
        name: profile.name,
        joinedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid), { groupIds: arrayUnion(groupId) });
      await updateProfile({ groupIds: [...(profile.groupIds ?? []), groupId] });
      setModal(null);
      router.push(`/group/${groupId}`);
    } catch {
      setError("Something went wrong. Try again.");
    }
    setBusy(false);
  }

  const firstName = profile?.name && profile.name !== "Anonymous"
    ? profile.name.split(" ")[0]
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">

      {/* Header */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Dashboard</p>
          <h1
            className="leading-none text-white"
            style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(36px, 6vw, 52px)", letterSpacing: "0.03em" }}
          >
            {firstName ? (
              <>Hey, {firstName}<span className="text-[#3B82F6]">.</span></>
            ) : (
              <>Your Groups<span className="text-[#3B82F6]">.</span></>
            )}
          </h1>
        </div>
        <div className="flex gap-2 mb-1">
          <button
            onClick={() => openModal("join")}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border border-white/[0.1] rounded-xl text-white/50 hover:text-white hover:border-white/20 transition-all"
          >
            <Hash size={14} />
            Join
          </button>
          <button
            onClick={() => openModal("create")}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-all shadow-[0_0_16px_rgba(59,130,246,0.3)]"
          >
            <Plus size={14} />
            Create
          </button>
        </div>
      </div>

      {/* Groups list */}
      {loadingGroups ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 glass rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl glass mx-auto flex items-center justify-center">
            <Users size={24} className="text-white/20" />
          </div>
          <div className="space-y-1">
            <p className="text-white/50 font-medium">No groups yet</p>
            <p className="text-sm text-white/25">Create one or ask a friend for an invite code</p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => openModal("join")}
              className="px-4 py-2 text-sm border border-white/[0.1] rounded-xl text-white/50 hover:text-white transition-all"
            >
              Enter code
            </button>
            <button
              onClick={() => openModal("create")}
              className="px-4 py-2 text-sm bg-[#3B82F6] rounded-xl text-white font-semibold hover:bg-[#2563EB] transition-all"
            >
              Create group
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {groups.map((group, i) => (
            <motion.button
              key={group.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => router.push(`/group/${group.id}`)}
              className="w-full text-left glass rounded-2xl p-5 hover:border-[#3B82F6]/25 hover:bg-white/[0.06] transition-all group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-[#3B82F6]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm truncate">{group.name}</h3>
                    <p className="text-xs text-white/25 mt-0.5 font-mono tracking-widest">
                      {group.inviteCode}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-white/20 group-hover:text-[#3B82F6] group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Modal overlay */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#141416] border border-white/[0.1] rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white text-lg">
                  {modal === "create" ? "Create a group" : "Join a group"}
                </h2>
                <button
                  onClick={() => setModal(null)}
                  className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {modal === "create" ? (
                <input
                  value={groupName}
                  onChange={e => { setGroupName(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="Group name (e.g. CS2024 Study Crew)"
                  maxLength={50}
                  autoFocus
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#3B82F6]/50 transition-colors"
                />
              ) : (
                <input
                  value={inviteCode}
                  onChange={e => { setInviteCode(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleJoin()}
                  placeholder="Invite code (e.g. AB12CD)"
                  maxLength={10}
                  autoFocus
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#3B82F6]/50 transition-colors uppercase tracking-widest font-mono"
                />
              )}

              {error && <p className="text-xs text-[#EF4444]">{error}</p>}

              <button
                onClick={modal === "create" ? handleCreate : handleJoin}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#3B82F6] text-white font-semibold text-sm rounded-xl hover:bg-[#2563EB] disabled:opacity-50 transition-all shadow-[0_0_16px_rgba(59,130,246,0.25)]"
              >
                {busy ? "Please wait…" : modal === "create" ? "Create Group" : "Join Group"}
                {!busy && <ArrowRight size={15} />}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
