"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/map",       label: "Map"       },
  { href: "/profile",   label: "Profile"   },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
      <span className="font-semibold tracking-tight">Friendly</span>
      <div className="flex gap-6 text-sm">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={
              pathname.startsWith(href)
                ? "font-medium text-black"
                : "text-zinc-400 hover:text-black transition-colors"
            }
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
