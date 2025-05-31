"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "@heroicons/react/outline";

const links = [
  { href: "/", label: "ホーム" },
  { href: "/popular", label: "人気プレイス" },
  { href: "/review", label: "レビューを書く" },
  { href: "/mypage", label: "マイページ" },
  { href: "/login", label: "ログイン" },
];

export default function Navbar() {
  const pathname = usePathname() ?? "/";
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="fixed top-0 w-full h-14 bg-blue-900 shadow-md z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-full px-4">
          <Link href="/" passHref>
            <a
              className="flex items-center py-2 px-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
              aria-label="STAR REPO ホームへ戻る"
            >
              <span className="text-yellow-400 text-xl font-bold mr-2">★</span>
              <span className="text-white text-lg font-semibold">STAR REPO</span>
            </a>
          </Link>
          <nav className="hidden md:flex space-x-6">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} passHref>
                <a
                  className={`text-white hover:text-gray-200 px-3 py-2 transition rounded-md ${
                    isActive(href) ? "bg-yellow-400 text-black" : ""
                  }`}
                >
                  {label}
                </a>
              </Link>
            ))}
          </nav>
          <button
            className="md:hidden text-white hover:text-gray-200 py-2 px-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
            aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <div className="bg-white bg-opacity-10 rounded-full p-1 hover:bg-opacity-20 transition">
                <XIcon className="h-6 w-6 text-white" />
              </div>
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-60 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`
          md:hidden fixed top-0 right-0 min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-gray-900
          transform transition-transform duration-300 ease-in-out z-60
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          w-4/5 rounded-tl-xl rounded-tr-xl shadow-lg
        `}
      >
        <nav className="pt-8 pb-8">
          <ul>
            {links.map(({ href, label }) => (
              <li key={href} className="border-b border-gray-600">
                <Link href={href} passHref>
                  <a
                    className={`block text-lg py-5 px-6 leading-relaxed transition ${
                      isActive(href)
                        ? "bg-yellow-400 text-black"
                        : "text-gray-100 hover:bg-gray-700 hover:text-white"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
