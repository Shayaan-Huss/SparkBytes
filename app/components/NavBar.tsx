"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  // hide navbar in signin/signup page
  const hideNavbar = pathname === "/signin" || pathname === "/createAcc";

  if (hideNavbar) return null;
  return ( 
    <nav className="w-full bg-white shadow p-4">
      <ul className="flex justify-between max-w-4xl mx-auto">
        <li><Link href="/" className="text-black">Home</Link></li>
        <li><Link href="/food" className="text-black">Food Listing</Link></li>
        <li><Link href="/about" className="text-black">About</Link></li>
      </ul>
    </nav>
  );
}