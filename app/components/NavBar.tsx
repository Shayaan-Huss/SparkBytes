"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  // hide navbar in signin/signup page
  const hideNavbar = pathname === "/signin" || pathname === "/createAcc";

  if (hideNavbar) return null;
  return ( 
    <nav className="w-full flex justify-between items-center bg-white shadow p-4 border-b-5">
      <span className="text-3xl text-stone-800 italic" style={{ fontFamily: 'Georgia, serif' }}>
        Spark!Bytes
      </span>
      <ul className="flex max-w-4xl gap-8 text-black" >
        
        <li><Link href="/" className="text-black">Home</Link></li>
        <li><Link href="/food" className="text-black">Food Listing</Link></li>
        <li><Link href="/events" className="text-black">Events</Link></li>
        <li><Link href="/signin" className="text-black">Sign in!</Link></li>
      </ul>
    </nav>
  );
}