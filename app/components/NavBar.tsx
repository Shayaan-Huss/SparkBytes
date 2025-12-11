"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  // hide navbar in signin/signup page
  const hideNavbar = pathname === "/signin" || pathname === "/createAcc";
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  if (hideNavbar) return null;
  return ( 
    <nav className="w-full flex justify-between items-center bg-white shadow p-4 border-b-4 border-stone-100">
      <span className="text-3xl text-stone-800 italic" style={{ fontFamily: 'Georgia, serif' }}>
        Spark!Bytes
      </span>
      <ul className="flex max-w-4xl gap-8 text-black" >
        
        <li><Link href="/" className="text-black">Home</Link></li>
        {/* <li><Link href="/food" className="text-black">Food Listing</Link></li> */}
        <li><Link href="/events" className="text-black">Events</Link></li>
        <li><button onClick={handleSignOut} className="text-black hover: cursor-pointer">Sign out</button></li>
      </ul>
    </nav>
  );
}