"use client";

import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  const { user, isSignedIn } = useUser();

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50
        backdrop-blur-xl bg-[#d9d9d91a] 
        border-b border-white/20 font-mono uppercase tracking-wide
      "
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* LOGO */}
        <Link
          href="/"
          className="text-md text-gray-900 hover:underline transition-colors"
        >
          Home
        </Link>

        {/* NAV */}
        <nav className="flex items-center gap-6">
          <Link
            href="/analysis"
            className="text-sm text-gray-800 hover:underline transition-colors"
          >
            Analyse
          </Link>

          {/* AUTH */}
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button
                className="
                  px-6 py-3 rounded-lg
                  bg-black text-white 
                  hover:bg-neutral-3 hover:text-black 
                  transition shadow-sm font-mono uppercase text-sm cursor-pointer
              "
              >
                Inloggen
              </button>
            </SignInButton>
          ) : (
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
                afterSignOutUrl="/"
              />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
