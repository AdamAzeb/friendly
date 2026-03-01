"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  doc, getDocs, serverTimestamp, getDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import type { FriendRequest } from "../../../types";
import { UserPlus, MessageSquare, Check, X, Users2, Sparkles } from "lucide-react";
import { avatarColor } from "../../../lib/avatarColor";

type Tab = "friends" | "network";

interface NetworkPerson {
  uid: string;
  name: string;
  mutualGroups: string[];
}

export default function FriendsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("friends");

  // All requests touching me (indexed by single field — no composite index needed)
  const [allIncoming, setAllIncoming] = useState<FriendRequest[]>([]);
  const [allOutgoing, setAllOutgoing] = useState<FriendRequest[]>([]);

  // Derived
  const pendingIncoming = allIncoming.filter(r => r.status === "pending");
  const friends = [
    ...allOutgoing.filter(r => r.status === "accepted"),
    ...allIncoming.filter(r => r.status === "accepted"),
  ];

  // Network
  const [networkPeople, setNetworkPeople] = useState<NetworkPerson[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const qIn  = query(collection(db, "friendRequests"), where("to",   "==", user.uid));
    const qOut = query(collection(db, "friendRequests"), where("from", "==", user.uid));

    const unsubIn  = onSnapshot(qIn,  snap => setAllIncoming(snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest))));
    const unsubOut = onSnapshot(qOut, snap => {
      const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
      setAllOutgoing(reqs);
      setSentRequests(new Set(reqs.filter(r => r.status === "pending").map(r => r.to)));
    });

    return () => { unsubIn(); unsubOut(); };
  }, [user]);

  async function loadNetwork() {
    if (!user || !profile?.groupIds?.length) return;
    setNetworkLoading(true);

    // Build set of UIDs we already have a relationship with
    const knownUids = new Set<string>([
      ...allOutgoing.map(r => r.to),
      ...allIncoming.map(r => r.from),
    ]);

    // Fetch all members from all my groups
    const memberMap = new Map<string, NetworkPerson>();
    await Promise.all(
      profile.groupIds.map(async (gid) => {
        const [groupSnap, membersSnap] = await Promise.all([
          getDoc(doc(db, "groups", gid)),
          getDocs(collection(db, "groups", gid, "members")),
        ]);
        const groupName = groupSnap.exists() ? (groupSnap.data().name as string) : "a group";
        membersSnap.docs.forEach(m => {
          if (m.id === user.uid) return;
          if (memberMap.has(m.id)) {
            memberMap.get(m.id)!.mutualGroups.push(groupName);
          } else {
            memberMap.set(m.id, {
              uid: m.id,
              name: (m.data().name as string) ?? "Someone",
              mutualGroups: [groupName],
            });
          }
        });
      })
    );

    const network = [...memberMap.values()]
      .filter(p => !knownUids.has(p.uid))
      .sort((a, b) => b.mutualGroups.length - a.mutualGroups.length);

    setNetworkPeople(network);
    setNetworkLoading(false);
  }

  useEffect(() => {
    if (tab === "network") loadNetwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user]);

  async function sendRequest(person: NetworkPerson) {
    if (!user || !profile) return;
    setSentRequests(prev => new Set([...prev, person.uid]));
    await addDoc(collection(db, "friendRequests"), {
      from: user.uid,
      fromName: profile.name,
      to: person.uid,
      toName: person.name,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  }

  async function acceptRequest(req: FriendRequest) {
    await updateDoc(doc(db, "friendRequests", req.id), { status: "accepted" });
  }

  async function declineRequest(req: FriendRequest) {
    await updateDoc(doc(db, "friendRequests", req.id), { status: "declined" });
  }

  function getFriendInfo(f: FriendRequest): { uid: string; name: string } {
    if (!user) return { uid: "", name: "" };
    return f.from === user.uid
      ? { uid: f.to,   name: f.toName   }
      : { uid: f.from, name: f.fromName };
  }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "friends", label: "Friends", count: pendingIncoming.length || undefined },
    { id: "network", label: "Network" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">

      {/* Header */}
      <div className="pt-1">
        <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Social</p>
        <h1
          className="leading-none text-white"
          style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(36px, 6vw, 52px)", letterSpacing: "0.03em" }}
        >
          Friends<span className="text-[#3B82F6]">.</span>
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl">
        {TABS.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === id ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-white/30 hover:text-white/60"
            }`}
          >
            {label}
            {count && (
              <span className="w-4 h-4 rounded-full bg-[#3B82F6] text-white text-[10px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── FRIENDS TAB ───────────────────────────────────────────────── */}
        {tab === "friends" && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Pending requests */}
            {pendingIncoming.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-white/35 uppercase tracking-widest font-semibold px-1">
                  Requests · {pendingIncoming.length}
                </p>
                {pendingIncoming.map(req => (
                  <div
                    key={req.id}
                    className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: avatarColor(req.fromName) + "20", color: avatarColor(req.fromName) }}>
                        {req.fromName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{req.fromName}</p>
                        <p className="text-xs text-white/30">wants to be friends</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => declineRequest(req)}
                        className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
                      >
                        <X size={13} />
                      </button>
                      <button
                        onClick={() => acceptRequest(req)}
                        className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white hover:bg-[#2563EB] transition-colors shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friends list */}
            <div className="space-y-2">
              {friends.length > 0 && (
                <p className="text-[11px] text-white/35 uppercase tracking-widest font-semibold px-1">
                  Your friends · {friends.length}
                </p>
              )}

              {friends.length === 0 && pendingIncoming.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16 space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl glass mx-auto flex items-center justify-center">
                    <Users2 size={22} className="text-white/20" />
                  </div>
                  <p className="text-white/40 font-medium text-sm">No friends yet</p>
                  <p className="text-xs text-white/25">Tap Network to find people from your groups</p>
                  <button
                    onClick={() => setTab("network")}
                    className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#3B82F6] text-xs font-semibold hover:bg-[#3B82F6]/20 transition-all"
                  >
                    <Sparkles size={12} />
                    Discover people
                  </button>
                </motion.div>
              ) : (
                friends.map((f, i) => {
                  const friend = getFriendInfo(f);
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: avatarColor(friend.name) + "20", color: avatarColor(friend.name) }}>
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{friend.name}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/dm/${friend.uid}`)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.1] text-xs font-medium transition-all shrink-0"
                      >
                        <MessageSquare size={12} />
                        Message
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ── NETWORK TAB ───────────────────────────────────────────────── */}
        {tab === "network" && (
          <motion.div
            key="network"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-white/35 leading-relaxed">
              People from your groups — sorted by how many you share.
            </p>

            {networkLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-[68px] glass rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : networkPeople.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 rounded-2xl glass mx-auto flex items-center justify-center">
                  <UserPlus size={22} className="text-white/20" />
                </div>
                <p className="text-white/40 font-medium text-sm">No suggestions yet</p>
                <p className="text-xs text-white/25">
                  {!profile?.groupIds?.length
                    ? "Join a group first to discover people"
                    : "Everyone in your groups is already connected"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {networkPeople.map((person, i) => (
                  <motion.div
                    key={person.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: avatarColor(person.name) + "20", color: avatarColor(person.name) }}>
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{person.name}</p>
                        <p className="text-xs text-white/30">
                          {person.mutualGroups.length === 1
                            ? `In ${person.mutualGroups[0]}`
                            : `${person.mutualGroups.length} mutual groups`}
                        </p>
                      </div>
                    </div>

                    {sentRequests.has(person.uid) ? (
                      <span className="text-[11px] text-white/25 font-medium px-3 py-1.5 rounded-xl border border-white/[0.07] shrink-0">
                        Requested
                      </span>
                    ) : (
                      <button
                        onClick={() => sendRequest(person)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#3B82F6] text-xs font-semibold hover:bg-[#3B82F6]/20 transition-all shrink-0"
                      >
                        <UserPlus size={12} />
                        Add
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
