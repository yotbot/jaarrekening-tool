"use client";

import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  const { user, isSignedIn } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* LOGO / NAAM */}
        <Link
          href="/"
          className="text-lg font-semibold text-gray-900 hover:text-blue-600"
        >
          Jaarrekening Checker
        </Link>

        {/* NAV */}
        <nav className="flex items-center gap-6">
          <Link
            href="/analysis"
            className="text-sm text-gray-700 hover:text-blue-600"
          >
            Wizard
          </Link>

          {/* AUTH STATUS */}
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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
