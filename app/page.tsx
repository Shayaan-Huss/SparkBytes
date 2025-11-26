"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, load_user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!load_user && !user) {
      router.replace("/signin");
    }
  }, [load_user, user, router]);

  if (load_user || !user) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">
        This is the Home page
      </h1>
    </main>
  );
}
