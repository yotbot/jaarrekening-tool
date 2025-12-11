"use client";

import { UserButton, useUser } from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser();
  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      Hi {user?.firstName || "stranger"}!
      <UserButton />
    </div>
  );
}
