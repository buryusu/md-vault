"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">MD<span>Vault</span></Link>
        <div className="nav-links">
          <Link href="/files" className={`nav-link${pathname.startsWith("/files") ? " active" : ""}`}>Browse</Link>
          {session && (
            <Link href="/tickets" className={`nav-link${pathname.startsWith("/tickets") ? " active" : ""}`}>Support</Link>
          )}
          {isAdmin && (
            <Link href="/admin" className={`nav-link${pathname.startsWith("/admin") ? " active" : ""}`}>Admin</Link>
          )}
          {session ? (
            <>
              {session.user?.image && (
                <Image src={session.user.image} alt="avatar" width={32} height={32} className="nav-avatar" />
              )}
              <button className="nav-sign-out" onClick={() => signOut()}>Sign out</button>
            </>
          ) : (
            <Link href="/login" className="nav-sign-btn">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
