"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "ホーム" },
  { href: "/popular", label: "人気プレイス" },
];

export default function Navbar() {
  const pathname = usePathname() ?? "/";
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 bg-white dark:bg-gray-800 shadow-md">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex h-full items-center justify-between">
          <Link
            href="/"
            aria-label="STAR REPO ホームへ戻る"
            className="flex items-center py-2 px-4 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
          >
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
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
            className="md:hidden py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
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
              {isOpen ? (
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
      </nav>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      {isOpen && (
        <nav className="fixed top-0 right-0 w-64 h-full bg-blue-900 z-30 shadow-lg md:hidden">
          <ul className="flex flex-col mt-14">
            {links.map(({ href, label }) => (
              <li key={href} className="px-6 py-4 hover:bg-blue-800">
                <Link
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="text-white text-lg"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
