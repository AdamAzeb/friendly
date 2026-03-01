"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Users, MapPin, Calendar, Zap, ArrowRight, Clock, CheckCircle, MessageSquare } from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!isInView || started) return;
    setStarted(true);
    const duration = 2000;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!ref.current) return;
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      ref.current.textContent = Math.floor(eased * target).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, started, target, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

const features = [
  {
    Icon: Calendar,
    title: "Smart Availability Engine",
    desc: "Set your schedule once. Friendly finds the perfect overlap for your whole group — no more pinging everyone in a group chat.",
    tag: "AI-Powered",
  },
  {
    Icon: MapPin,
    title: "Live Campus Map",
    desc: "See who's studying where, right now. Spot a friend in the library, find a study buddy in the SU, or share your own location.",
    tag: "Real-time",
  },
  {
    Icon: Users,
    title: "Instant Study Groups",
    desc: "Create a group in one tap. Share a 6-character code. Your whole crew is in within seconds — no invites, no faff.",
    tag: "Instant",
  },
  {
    Icon: MessageSquare,
    title: "Group Chat & Sessions",
    desc: "Coordinate in real time. Propose a session, collect RSVPs, and chat — all in one place, without leaving the app.",
    tag: "Frictionless",
  },
];

const stats = [
  { label: "Active Groups",        target: 240,  suffix: "+" },
  { label: "Sessions Coordinated", target: 1200, suffix: "+" },
  { label: "Students on campus",   target: 870,  suffix: "+" },
];

const howItWorks = [
  { step: "01", title: "Join or create a group", desc: "Share a 6-character code with your friends. They're in instantly — no sign-up required." },
  { step: "02", title: "Set your status", desc: "Tell the map whether you're locked in, free, or open to study together. Update it anytime." },
  { step: "03", title: "Find the overlap", desc: "Friendly's availability engine scans everyone's schedule and surfaces the best times to meet." },
  { step: "04", title: "Show up", desc: "Propose a session, collect RSVPs in real time, and chat with your group while you coordinate." },
];

export default function LandingPage() {
  const featuresRef = useRef(null);
  const howRef = useRef(null);
  const statsRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const howInView = useInView(howRef, { once: true, margin: "-80px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white overflow-x-hidden">

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* Full-bleed image background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=80')",
          }}
        />

        {/* Dark overlay layers */}
        <div className="absolute inset-0 bg-[#0D0D0F]/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0F] via-[#0D0D0F]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-transparent to-[#0D0D0F]/30" />

        {/* Blue accent glow */}
        <div className="absolute bottom-0 left-0 w-[60%] h-[50%] bg-gradient-to-tr from-[rgba(59,130,246,0.08)] to-transparent rounded-full blur-3xl" />
        <div className="absolute top-[30%] right-[10%] w-72 h-72 bg-[rgba(230,103,171,0.04)] rounded-full blur-3xl" />

        {/* Grid overlay */}
        <div className="absolute inset-0 grid-overlay opacity-40" />

        {/* Hero content */}
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-20 pt-28 pb-20 max-w-screen-xl mx-auto">
          <div className="max-w-2xl">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 border border-white/[0.1] rounded-full px-4 py-1.5 text-xs text-white/50 mb-8 glass"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
              Built for RGU Hack 2026
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[clamp(52px,8vw,96px)] leading-[0.95] font-normal text-white mb-4"
              style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.02em" }}
            >
              Your campus.<br />
              Always in sync<span className="text-[#3B82F6]">.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg sm:text-xl text-white/55 font-light leading-relaxed mb-4 max-w-xl"
            >
              Welcome to <span className="text-white font-medium">Friendly</span> — the fastest way to find who&apos;s free on campus, coordinate study sessions, and see your friends on the live map. No account required.
            </motion.p>

            {/* Value props */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-wrap gap-x-5 gap-y-1.5 mb-8"
            >
              {[
                "Find who's free instantly",
                "Plan study sessions together",
                "See the live campus map",
                "Chat with your group",
              ].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-white/45">
                  <span className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                  {t}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-4"
            >
              <Link
                href="/dashboard"
                className="group relative flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold px-7 py-3.5 rounded-2xl transition-all duration-200 shadow-[0_0_24px_rgba(59,130,246,0.35)] hover:shadow-[0_0_36px_rgba(59,130,246,0.5)]"
              >
                Get Started — it&apos;s free
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/map"
                className="flex items-center gap-2 border border-white/[0.12] text-white/70 hover:text-white hover:border-white/25 font-medium px-7 py-3.5 rounded-2xl transition-all duration-200 backdrop-blur-sm"
              >
                <MapPin size={16} />
                See the live map
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-white/[0.06]"
            >
              {[
                { icon: CheckCircle, text: "No account needed" },
                { icon: CheckCircle, text: "Fully anonymous" },
                { icon: CheckCircle, text: "Works on mobile" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-white/40">
                  <Icon size={14} className="text-[#3B82F6]" />
                  {text}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0D0D0F] to-transparent" />
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section ref={howRef} className="relative py-24 px-6 sm:px-10 lg:px-20 border-t border-white/[0.05]">
        <div className="max-w-screen-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={howInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <p className="text-xs text-[#3B82F6] font-semibold tracking-widest uppercase mb-3">Simple by design</p>
            <h2
              className="text-[clamp(36px,5vw,64px)] leading-tight"
              style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.02em" }}
            >
              Open the app.<br />Start coordinating.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 28 }}
                animate={howInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <span
                  className="text-[72px] leading-none font-normal text-white/[0.05] select-none"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {step}
                </span>
                <h3 className="text-base font-semibold text-white mt-1 mb-2">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────────────── */}
      <section ref={featuresRef} className="relative py-24 px-6 sm:px-10 lg:px-20 border-t border-white/[0.05]">
        <div className="max-w-screen-xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <p className="text-xs text-[#3B82F6] font-semibold tracking-widest uppercase mb-3">Everything you need</p>
            <h2
              className="text-[clamp(36px,5vw,64px)] leading-tight"
              style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.02em" }}
            >
              Built for the way<br />students actually live
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map(({ Icon, title, desc, tag }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 32 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass rounded-2xl p-7 group hover:border-white/[0.14] transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                    <Icon size={18} className="text-[#3B82F6]" />
                  </div>
                  <span className="text-[10px] font-semibold text-white/30 tracking-widest uppercase border border-white/[0.08] rounded-full px-2.5 py-1">
                    {tag}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="relative py-20 px-6 sm:px-10 lg:px-20 border-t border-white/[0.05]">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(59,130,246,0.03)] to-transparent" />
        <div className="relative max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4">
            {stats.map(({ label, target, suffix }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 24 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="text-center"
              >
                <div
                  className="text-[clamp(48px,6vw,80px)] text-white leading-none mb-2"
                  style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.02em" }}
                >
                  {statsInView ? <AnimatedCounter target={target} suffix={suffix} /> : `0${suffix}`}
                </div>
                <p className="text-sm text-white/40">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-28 px-6 sm:px-10 lg:px-20 border-t border-white/[0.05]">
        <div className="max-w-screen-xl mx-auto text-center">
          <p className="text-xs text-[#E667AB] font-semibold tracking-widest uppercase mb-4">No signup. No faff.</p>
          <h2
            className="text-[clamp(40px,6vw,80px)] leading-tight mb-4"
            style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.02em" }}
          >
            Your crew is waiting<span className="text-[#3B82F6]">.</span>
          </h2>
          <p className="text-white/40 mb-10 max-w-md mx-auto text-sm leading-relaxed">
            Open Friendly, share your code, and start coordinating in seconds. Works on any device, no download needed.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200 shadow-[0_0_32px_rgba(59,130,246,0.3)] hover:shadow-[0_0_48px_rgba(59,130,246,0.45)] text-lg"
            >
              Open the app
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 border border-white/[0.12] text-white/70 hover:text-white hover:border-white/25 font-medium px-8 py-4 rounded-2xl transition-all duration-200 text-lg"
            >
              <Clock size={18} />
              See who&apos;s online
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-8 px-6 sm:px-10 lg:px-20">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#3B82F6] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">F</span>
            </div>
            <span className="text-white/30 text-sm" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.08em" }}>
              Friendly
            </span>
          </div>
          <p className="text-xs text-white/20">Built for students. Built for campus.</p>
        </div>
      </footer>
    </div>
  );
}
