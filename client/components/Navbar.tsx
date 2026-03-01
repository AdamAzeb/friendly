"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Users, Map, User, UserPlus } from "lucide-react";
import { avatarColor, isValidImageUrl } from "../lib/avatarColor";

const STATUS_COLORS: Record<string, string> = {
  locked_in: "#EF4444", come_study: "#10B981",
  free: "#3B82F6", eating: "#F59E0B", invisible: "#4B5563",
};

const links = [
  { href: "/dashboard", label: "Groups",  Icon: Users,    exact: true  },
  { href: "/friends",   label: "Friends", Icon: UserPlus, exact: false },
  { href: "/map",       label: "Map",     Icon: Map,      exact: true  },
  { href: "/profile",   label: "Profile", Icon: User,     exact: true  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0D0D0F]/80 backdrop-blur-xl px-3 sm:px-6 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#3B82F6] flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.4)]">
            <span className="text-white text-xs font-bold">F</span>
          </div>
          <span
            className="text-white tracking-wider hidden sm:inline"
            style={{ fontFamily: "var(--font-bebas)", fontSize: "22px", letterSpacing: "0.08em" }}
          >
            Friendly
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {links.map(({ href, label, Icon, exact }) => {
            const active = exact
              ? pathname === href || pathname.startsWith(href + "/")
              : pathname === href || pathname.startsWith(href + "/") || pathname.startsWith("/dm");
            const isActive = href === "/friends"
              ? pathname.startsWith("/friends") || pathname.startsWith("/dm")
              : exact
                ? pathname === href || pathname.startsWith(href + "/")
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-white/[0.07] border border-white/[0.1]" />
                )}
                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                <span className="hidden sm:inline relative z-10 text-xs">{label}</span>
                {isActive && (
                  <span className="relative z-10 w-1 h-1 rounded-full bg-[#3B82F6]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User avatar chip */}
        {profile?.name && profile.name !== "Anonymous" ? (
          <Link
            href="/profile"
            className="hidden lg:flex items-center gap-2 border border-white/[0.08] rounded-full px-3 py-1.5 text-xs font-medium text-white/50 hover:border-[#3B82F6]/40 hover:text-white transition-all shrink-0"
          >
            <span className="relative w-5 h-5 shrink-0">
              <span className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center font-bold text-[10px]"
                style={{ background: isValidImageUrl(profile.avatarUrl) ? "transparent" : avatarColor(profile.name) + "30",
                  color: avatarColor(profile.name) }}>
                {isValidImageUrl(profile.avatarUrl)
                  ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover rounded-full" />
                  : profile.name.charAt(0).toUpperCase()
                }
              </span>
              {profile.status && profile.status !== "invisible" && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0D0D0F]"
                  style={{ background: STATUS_COLORS[profile.status] ?? "#4B5563" }} />
              )}
            </span>
            {profile.name}
          </Link>
        ) : (
          <div className="w-4 hidden lg:block shrink-0" />
        )}
      </div>
    </nav>
  );
}
