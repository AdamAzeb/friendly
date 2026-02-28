"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Plus,
  X,
  Sparkles,
  CalendarDays,
  Users,
  Send,
} from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import {
  saveAvailability,
  deleteAvailability,
  fetchUserAvailability,
  fetchGroupAvailability,
} from "../../../../lib/availabilityService";
import { getTopSuggestedSlots } from "../../../../lib/recommendationEngine";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import type { AvailabilityBlock, SuggestedSlot } from "../../../../types";

/* ── Constants ──────────────────────────────────────────── */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Display order: Mon(1) → Sun(0)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
  }
}

/* ── Animation variants ────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 24 },
  },
};

const pillVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
};

/* ── Component ─────────────────────────────────────────── */

interface AvailabilityPanelProps {
  groupId: string;
}

export default function AvailabilityPanel({ groupId }: AvailabilityPanelProps) {
  const { user } = useAuth();

  // form
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("11:00");

  // data
  const [myBlocks, setMyBlocks] = useState<AvailabilityBlock[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedSlot[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  /* ── Data fetching ─────────────────────────────────── */

  const fetchMembers = useCallback(async () => {
    try {
      const snap = await getDocs(
        collection(db, "groups", groupId, "members")
      );
      const ids = snap.docs.map((d: { id: string }) => d.id);
      if (user?.uid && !ids.includes(user.uid)) ids.push(user.uid);
      setMemberIds(ids);
      return ids;
    } catch {
      return user?.uid ? [user.uid] : [];
    }
  }, [groupId, user?.uid]);

  const fetchMyBlocks = useCallback(async () => {
    if (!user?.uid) return;
    const blocks = await fetchUserAvailability(user.uid);
    setMyBlocks(blocks);
  }, [user?.uid]);

  const computeSuggestions = useCallback(async () => {
    if (memberIds.length === 0) return;
    setLoadingSuggestions(true);
    try {
      const grouped = await fetchGroupAvailability(memberIds);
      const suggested = getTopSuggestedSlots(grouped, memberIds);
      setSuggestions(suggested);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [memberIds]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetchMyBlocks();
  }, [fetchMyBlocks]);

  useEffect(() => {
    if (memberIds.length > 0) computeSuggestions();
  }, [memberIds, computeSuggestions]);

  /* ── Handlers ──────────────────────────────────────── */

  const handleAdd = async () => {
    if (!user?.uid) return;
    if (start >= end) return alert("Start time must be before end time");
    setSaving(true);
    try {
      await saveAvailability(user.uid, { dayOfWeek, start, end });
      await fetchMyBlocks();
      await computeSuggestions();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (block: AvailabilityBlock) => {
    if (!user?.uid || !block.id) return;
    setSaving(true);
    try {
      await deleteAvailability(user.uid, block.id);
      await fetchMyBlocks();
      await computeSuggestions();
    } finally {
      setSaving(false);
    }
  };

  const toggleSlot = (key: string) =>
    setSelectedSlot((prev) => (prev === key ? null : key));

  /* ── Sorted blocks ─────────────────────────────────── */

  const sortedBlocks = [...myBlocks].sort((a, b) =>
    a.dayOfWeek !== b.dayOfWeek
      ? a.dayOfWeek - b.dayOfWeek
      : a.start.localeCompare(b.start)
  );

  const bestOverlap = suggestions.length > 0 ? suggestions[0].overlapCount : 0;

  /* ── Render ────────────────────────────────────────── */

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-2 space-y-5 pb-28"
    >
      {/* ═══════════════════════════════════════════════════
          SECTION 1 — Add Availability
          ═══════════════════════════════════════════════════ */}
      <motion.section variants={cardVariants} className="glass-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
          </div>
          <h2 className="text-base font-semibold">Add Availability</h2>
        </div>

        {/* Day picker pills */}
        <div className="grid grid-cols-7 gap-1.5 mb-5">
          {DAY_ORDER.map((i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.92 }}
              onClick={() => setDayOfWeek(i)}
              className={`flex h-11 items-center justify-center rounded-xl text-xs font-medium transition-all ${
                dayOfWeek === i
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400"
              }`}
            >
              {DAYS[i]}
            </motion.button>
          ))}
        </div>

        {/* Time selectors */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              From
            </span>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <select
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              To
            </span>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <select
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        {/* Add button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleAdd}
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-colors hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {saving ? "Saving…" : "Add Time Slot"}
        </motion.button>
      </motion.section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2 — My Blocks
          ═══════════════════════════════════════════════════ */}
      <motion.section variants={cardVariants} className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
              <Clock className="h-4 w-4 text-emerald-500" />
            </div>
            <h2 className="text-base font-semibold">My Schedule</h2>
          </div>
          {myBlocks.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {myBlocks.length} slot{myBlocks.length !== 1 && "s"}
            </span>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {sortedBlocks.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-6 text-center text-sm text-zinc-400"
            >
              No availability yet — add your free times above.
            </motion.p>
          )}

          {sortedBlocks.map((block) => {
            const key = `${block.dayOfWeek}-${block.start}`;
            return (
              <motion.div
                key={key}
                variants={pillVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="mb-2 flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-500">
                    {DAYS[block.dayOfWeek]}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {DAYS_FULL[block.dayOfWeek]}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {block.start} – {block.end}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleDelete(block)}
                  disabled={saving}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3 — Suggested Slots
          ═══════════════════════════════════════════════════ */}
      <motion.section variants={cardVariants} className="glass-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <h2 className="text-base font-semibold">Best Times to Meet</h2>
        </div>

        {loadingSuggestions && (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="h-5 w-5 rounded-full border-2 border-zinc-200 border-t-indigo-500"
            />
          </div>
        )}

        {!loadingSuggestions && suggestions.length === 0 && (
          <div className="py-6 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm text-zinc-400">
              No overlapping times yet.
              <br />
              Ask members to add availability!
            </p>
          </div>
        )}

        <AnimatePresence>
          {suggestions.map((slot, i) => {
            const key = `${slot.dayOfWeek}-${slot.start}`;
            const isSelected = selectedSlot === key;
            const isBest = i === 0;
            const overlapRatio =
              bestOverlap > 0 ? slot.overlapCount / bestOverlap : 0;

            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleSlot(key)}
                className={`mb-3 flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-500/10 dark:border-emerald-500/50 dark:bg-emerald-500/10"
                    : isBest
                    ? "border-indigo-200 bg-indigo-50/60 dark:border-indigo-500/30 dark:bg-indigo-500/5"
                    : "border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/30"
                }`}
              >
                {/* Rank badge */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                    isSelected
                      ? "bg-emerald-500 text-white"
                      : isBest
                      ? "bg-indigo-500 text-white"
                      : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  #{i + 1}
                </div>

                {/* Slot info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {DAYS_FULL[slot.dayOfWeek]}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {slot.start} – {slot.end}
                  </p>
                </div>

                {/* Overlap indicator */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        overlapRatio >= 1
                          ? "bg-emerald-500"
                          : overlapRatio >= 0.5
                          ? "bg-amber-500"
                          : "bg-zinc-400"
                      }`}
                    />
                    <span className="text-xs font-bold tabular-nums">
                      {slot.overlapCount}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    member{slot.overlapCount !== 1 && "s"} free
                  </span>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.section>

      {/* ═══════════════════════════════════════════════════
          STICKY BOTTOM — Propose Session
          ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6 pt-3"
          >
            <div className="mx-auto max-w-lg">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 text-base font-semibold text-white shadow-2xl shadow-emerald-500/30 transition-colors hover:bg-emerald-600 active:bg-emerald-700"
              >
                <Send className="h-5 w-5" />
                Propose Session
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
