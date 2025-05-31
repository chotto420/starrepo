"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "ホーム" },
  { href: "/popular", label: "人気プレイス" },
  { href: "/review", label: "レビューを書く" },
  { href: "/mypage", label: "マイページ" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white dark:bg-gray-800 shadow">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center text-xl font-bold">
            <span className="text-yellow-400 text-2xl mr-1">★</span>
            <span>STAR REPO</span>
          </Link>
          <div className="hidden md:flex space-x-6">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={
                  (isActive(href)
                    ? "font-bold text-yellow-600"
                    : "text-gray-700 dark:text-gray-200") +
                  " hover:text-yellow-500 transition-colors"
                }
              >
                {label}
              </Link>
            ))}
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="sr-only">Toggle menu</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>
        {open && (
          <div className="md:hidden pb-3 pt-2 space-y-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={
                  (isActive(href)
                    ? "font-bold text-yellow-600"
                    : "text-gray-700 dark:text-gray-200") +
                  " block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
