"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/today", label: "Today" },
  { href: "/checker", label: "Checker" },
  { href: "/menu", label: "Menu" },
  { href: "/weight", label: "Weight" },
  { href: "/foods", label: "Foods" },
  { href: "/profile", label: "Profile" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-around border-t border-camel/40 bg-cream py-2 sm:justify-start sm:gap-6 sm:border-t-0 sm:border-b sm:px-6">
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full transition ${
              active ? "text-oro-viejo" : "text-cafe hover:text-chocolate"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
