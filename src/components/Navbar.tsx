"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "@heroicons/react/outline";

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
    <>
      <header className="fixed top-0 inset-x-0 z-10 h-14 bg-blue-900 shadow-md">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
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
                className={`${isActive(href) ? "text-yellow-400" : "text-gray-100"} hover:text-yellow-300 transition-colors`}
              >
                {label}
              </Link>
            ))}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
            className="md:hidden py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
          >
            {isOpen ? (
              <div className="bg-white bg-opacity-10 rounded-full p-1 hover:bg-opacity-20 transition">
                <XIcon className="h-6 w-6 text-white" />
              </div>
            ) : (
              <MenuIcon className="h-6 w-6 text-white" />
            )}
          </button>
        </nav>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full bg-gradient-to-b from-blue-800 to-gray-900 transform transition-transform duration-300 ease-in-out z-30 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } w-4/5 sm:w-full md:w-1/3 rounded-l-xl shadow-lg`}
      >
        <nav className="mt-14">
          <ul>
            {links.map(({ href, label }) => (
              <li key={href} className="border-b border-gray-700">
                <Link
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`block text-gray-100 text-lg py-4 px-6 hover:bg-gray-700 hover:text-white transition ${
                    isActive(href) ? "text-yellow-400" : ""
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
