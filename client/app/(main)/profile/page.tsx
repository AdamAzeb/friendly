"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import type { StudyStatus } from "../../../types";
import { User, GraduationCap, Sparkles, MapPin, CheckCircle, Lock, BookOpen, Coffee, Ghost, Building2, Camera } from "lucide-react";
import { avatarColor, isValidImageUrl } from "../../../lib/avatarColor";

const UNIVERSITIES = [
  "Robert Gordon University (RGU)",
  "University of Aberdeen",
  "University of Edinburgh",
  "University of Glasgow",
  "University of Strathclyde",
  "Heriot-Watt University",
  "Edinburgh Napier University",
  "Glasgow Caledonian University",
  "University of Dundee",
  "University of St Andrews",
  "Stirling University",
  "University of the Highlands and Islands",
  "Queen Margaret University",
  "Other",
];

const DEGREES = ["Accounting","Anthropology","Architecture","Astrophysics","Biology","Biomedical Science","Business Management","Chemistry","Civil Engineering","Computer Science","Economics","Education","Electrical Engineering","English Literature","Environmental Science","Film Studies","Finance","Geography","History","International Relations","Law","Mathematics","Medicine","Mechanical Engineering","Music","Nursing","Petroleum Engineering","Philosophy","Physics","Politics","Psychology","Sociology","Statistics","Other"];
const YEARS   = ["1st Year","2nd Year","3rd Year","4th Year","5th Year","Postgrad (MSc/MA)","PhD"];
const INTERESTS = ["Anime","Art & Design","Badminton","Basketball","Board Games","Chess","Climbing","Coffee","Cooking","Cycling","Dancing","Fashion","Film & TV","Football","Gaming","Gym & Fitness","Hiking","History","Journalism","Languages","Mathematics","Music (Listening)","Music (Playing)","Photography","Poetry","Politics","Programming","Reading","Robotics","Running","Science","Skating","Swimming","Tennis","Travel","Volunteering","Writing","Yoga"];

const STATUS_OPTIONS = [
  { value: "locked_in"  as StudyStatus, label: "Locked in",          desc: "Deep focus — do not disturb",  Icon: Lock,     color: "#EF4444" },
  { value: "come_study" as StudyStatus, label: "Come study with me", desc: "Open for study buddies",        Icon: BookOpen, color: "#10B981" },
  { value: "free"       as StudyStatus, label: "Free time",           desc: "Hanging out, anyone welcome",  Icon: Coffee,   color: "#3B82F6" },
  { value: "eating"     as StudyStatus, label: "Going to eat",        desc: "Heading for food",             Icon: Sparkles, color: "#F59E0B" },
  { value: "invisible"  as StudyStatus, label: "Invisible",           desc: "Hidden from the campus map",   Icon: Ghost,    color: "#6B7280" },
];

const CAMPUS_LOCATIONS = [
  { label: "RGU Library",             lat: 57.1305, lng: -2.1380 },
  { label: "RGU Student Association", lat: 57.1298, lng: -2.1392 },
  { label: "RGU Sportzone",           lat: 57.1290, lng: -2.1402 },
  { label: "Scott Sutherland School", lat: 57.1293, lng: -2.1405 },
  { label: "Riverside East",          lat: 57.1310, lng: -2.1365 },
  { label: "RGU City Campus",         lat: 57.1508, lng: -2.0993 },
  { label: "Aberdeen City Centre",    lat: 57.1497, lng: -2.0943 },
];

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();

  const [name,          setName]       = useState("");
  const [university,    setUniversity] = useState("Robert Gordon University (RGU)");
  const [degree,        setDegree]     = useState("");
  const [year,          setYear]       = useState("");
  const [interests,     setInterests]  = useState<string[]>([]);
  const [status,        setStatus]     = useState<StudyStatus>("invisible");
  const [avatarUrl,     setAvatarUrl]  = useState("");
  const [shareLocation, setShare]      = useState(false);
  const [saving,        setSaving]     = useState(false);
  const [saved,         setSaved]      = useState(false);
  const [nameError,     setNameError]  = useState("");
  const [locationMode,  setLocMode]    = useState<"gps" | "preset" | "none">("none");
  const [selectedSpot,  setSpot]       = useState<string | null>(null);
  const [settingLoc,    setSettingLoc] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name !== "Anonymous" ? profile.name : "");
    setUniversity(profile.university ?? "Robert Gordon University (RGU)");
    setDegree(profile.degree ?? "");
    setYear(profile.year ?? "");
    setInterests(profile.interests ?? []);
    setStatus(profile.status ?? "invisible");
    setAvatarUrl(profile.avatarUrl ?? "");
    setShare(profile.shareLocation ?? false);
    if (profile.shareLocation) setLocMode("gps");
  }, [profile]);

  function toggleInterest(i: string) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  async function handleSave() {
    if (!name.trim()) { setNameError("Please enter a display name."); return; }
    if (name.trim().length < 2) { setNameError("Name must be at least 2 characters."); return; }
    setNameError("");
    setSaving(true);
    await updateProfile({ name: name.trim(), university, degree, year, interests, status, avatarUrl, shareLocation });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function setPresetLocation(spot: typeof CAMPUS_LOCATIONS[number]) {
    if (!user) return;
    setSettingLoc(true);
    setSpot(spot.label);
    await updateDoc(doc(db, "users", user.uid), { lat: spot.lat, lng: spot.lng, shareLocation: true });
    await updateProfile({ shareLocation: true, lat: spot.lat, lng: spot.lng });
    setShare(true);
    setSettingLoc(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      <div className="pt-1">
        <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Your Account</p>
        <h1 className="leading-none text-white" style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(36px,6vw,52px)", letterSpacing: "0.03em" }}>
          Profile<span className="text-[#3B82F6]">.</span>
        </h1>
      </div>

      {/* Profile header card */}
      {profile && profile.name !== "Anonymous" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
          className="glass rounded-2xl p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border-2"
                style={{ borderColor: (STATUS_OPTIONS.find(o => o.value === profile.status)?.color ?? "#4B5563") + "60",
                  background: isValidImageUrl(profile.avatarUrl) ? "transparent" : "rgba(13,13,15,0.9)" }}>
                {isValidImageUrl(profile.avatarUrl)
                  ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-extrabold" style={{ color: avatarColor(profile.name) }}>{profile.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              {/* Status dot */}
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-[#0D0D0F]"
                style={{ background: STATUS_OPTIONS.find(o => o.value === profile.status)?.color ?? "#4B5563" }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white truncate">{profile.name}</p>
              {profile.university && <p className="text-xs text-white/40 truncate mt-0.5">{profile.university}</p>}
              {(profile.degree || profile.year) && (
                <p className="text-xs text-white/30 truncate mt-0.5">
                  {[profile.degree, profile.year].filter(Boolean).join(" · ")}
                </p>
              )}
              {/* Status pill */}
              {(() => {
                const s = STATUS_OPTIONS.find(o => o.value === profile.status);
                return s ? (
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                    style={{ background: s.color + "18", borderColor: s.color + "50", color: s.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                ) : null;
              })()}
            </div>
          </div>

          {/* Interest tags */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/[0.06]">
              {profile.interests.slice(0, 5).map(i => (
                <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#E667AB]/10 border border-[#E667AB]/25 text-[#E667AB]">{i}</span>
              ))}
              {profile.interests.length > 5 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] text-white/25 border border-white/[0.07]">+{profile.interests.length - 5}</span>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Name */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><User size={13} className="text-[#3B82F6]" /><label className="text-sm font-semibold text-white/70">Display Name <span className="text-[#3B82F6]">*</span></label></div>
        <input value={name} onChange={e => { setName(e.target.value); setNameError(""); }} placeholder="e.g. Jamie" maxLength={40}
          className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#3B82F6]/50 transition-colors ${nameError ? "border-[#EF4444]/50" : "border-white/[0.08]"}`} />
        {nameError && <p className="text-xs text-[#EF4444]">{nameError}</p>}
      </motion.section>

      {/* Avatar URL */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Camera size={13} className="text-[#3B82F6]" /><label className="text-sm font-semibold text-white/70">Profile Picture</label></div>
        <div className="flex items-center gap-4">
          {/* Avatar preview */}
          <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-white/[0.1]"
            style={{ background: isValidImageUrl(avatarUrl) ? "transparent" : "rgba(13,13,15,0.9)" }}>
            {isValidImageUrl(avatarUrl)
              ? <img src={avatarUrl} alt="preview" className="w-full h-full object-cover" />
              : <span className="text-xl font-extrabold" style={{ color: avatarColor(name || "A") }}>{(name || "A").charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 space-y-1.5">
            <input
              type="url"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="Paste an image URL (https://...)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#3B82F6]/50 transition-colors"
            />
            <p className="text-[10px] text-white/25">Shown on your campus map pin and in chats. Any public https:// image URL.</p>
          </div>
        </div>
      </motion.section>

      {/* University */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><Building2 size={13} className="text-[#3B82F6]" /><label className="text-sm font-semibold text-white/70">University</label></div>
        <select value={university} onChange={e => setUniversity(e.target.value)} style={{ colorScheme: "dark" }}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B82F6]/50 cursor-pointer transition-colors">
          {UNIVERSITIES.map(u => <option key={u} value={u} className="bg-[#141416]">{u}</option>)}
        </select>
      </motion.section>

      {/* Degree */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }} className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2"><GraduationCap size={13} className="text-[#3B82F6]" /><label className="text-sm font-semibold text-white/70">Degree</label></div>
        <select value={degree} onChange={e => setDegree(e.target.value)} style={{ colorScheme: "dark" }}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#3B82F6]/50 cursor-pointer transition-colors">
          <option value="" className="bg-[#141416]">Select your degree...</option>
          {DEGREES.map(d => <option key={d} value={d} className="bg-[#141416]">{d}</option>)}
        </select>
      </motion.section>

      {/* Year */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="glass rounded-2xl p-5 space-y-3">
        <label className="text-sm font-semibold text-white/70">Year of Study</label>
        <div className="flex flex-wrap gap-2">
          {YEARS.map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${year === y ? "bg-[#3B82F6] border-[#3B82F6] text-white" : "border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/70"}`}>
              {y}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Interests */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Sparkles size={13} className="text-[#3B82F6]" /><label className="text-sm font-semibold text-white/70">Interests</label></div>
          {interests.length > 0 && <span className="text-xs text-[#E667AB] font-semibold">{interests.length} selected</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(interest => (
            <button key={interest} onClick={() => toggleInterest(interest)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${interests.includes(interest) ? "bg-[#E667AB]/15 border-[#E667AB]/40 text-[#E667AB]" : "border-white/[0.07] text-white/30 hover:border-white/15 hover:text-white/55"}`}>
              {interest}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Status */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5 space-y-3">
        <div><label className="text-sm font-semibold text-white/70">Current Status</label><p className="text-xs text-white/25 mt-0.5">Shown on the campus map</p></div>
        <div className="space-y-2">
          {STATUS_OPTIONS.map(({ value, label, desc, Icon, color }) => (
            <button key={value} onClick={() => setStatus(value)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${status === value ? "bg-white/[0.04]" : "border-white/[0.06] hover:border-white/[0.12]"}`}
              style={status === value ? { borderColor: color + "55" } : {}}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "18" }}><Icon size={14} style={{ color }} /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white">{label}</p><p className="text-xs text-white/30 mt-0.5">{desc}</p></div>
              {status === value && <CheckCircle size={14} style={{ color }} className="shrink-0" />}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Location */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }} className="glass rounded-2xl p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5"><MapPin size={13} className="text-[#3B82F6]" /><label className="text-sm font-semibold text-white/70">My Location</label></div>
          <p className="text-xs text-white/25">Choose how your pin appears on the campus map</p>
        </div>

        {/* Mode pills */}
        <div className="flex gap-2">
          {([
            { id: "none",   label: "Hidden"      },
            { id: "preset", label: "Campus spot"  },
            { id: "gps",    label: "Live GPS"     },
          ] as const).map(({ id, label }) => (
            <button key={id}
              onClick={() => {
                setLocMode(id);
                if (id === "none") { setShare(false); setSpot(null); }
                else if (id === "gps") setShare(true);
              }}
              className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${
                locationMode === id ? "bg-[#3B82F6]/15 border-[#3B82F6]/40 text-[#3B82F6]" : "border-white/[0.08] text-white/35 hover:border-white/20 hover:text-white/60"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {locationMode === "gps" && (
          <p className="text-xs text-white/35 leading-relaxed">
            Your device GPS tracks your position in real time while the map is open.
          </p>
        )}

        {locationMode === "preset" && (
          <div className="space-y-1.5">
            <p className="text-xs text-white/35 mb-2">Pick your spot on campus:</p>
            {CAMPUS_LOCATIONS.map(spot => (
              <button key={spot.label} onClick={() => setPresetLocation(spot)} disabled={settingLoc}
                className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  selectedSpot === spot.label ? "bg-[#3B82F6]/10 border-[#3B82F6]/40 text-white" : "border-white/[0.08] text-white/50 hover:border-white/20 hover:text-white"
                }`}>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: selectedSpot === spot.label ? "#3B82F6" : "rgba(255,255,255,0.2)" }} />
                  <span className="text-sm">{spot.label}</span>
                </div>
                {selectedSpot === spot.label && (
                  settingLoc ? <span className="text-[10px] text-[#3B82F6]">Setting…</span> : <CheckCircle size={13} className="text-[#3B82F6]" />
                )}
              </button>
            ))}
          </div>
        )}

        {locationMode === "none" && (
          <p className="text-xs text-white/25 leading-relaxed">
            You won&apos;t appear on the map. You can change this any time from the Map page.
          </p>
        )}
      </motion.section>

      {/* Save */}
      <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
        onClick={handleSave} disabled={saving}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50 ${saved ? "bg-[#10B981] text-white" : "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"}`}>
        {saving ? "Saving..." : saved ? "Saved" : "Save Profile"}
      </motion.button>
    </div>
  );
}
