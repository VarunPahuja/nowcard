"use client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";

const Nav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
      <div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => router.push("/")}
      >
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-black text-xl italic group-hover:scale-110 transition-transform">
          N
        </div>
        <span className="text-white font-bold text-xl tracking-tighter">
          NowCard
        </span>
      </div>

      <nav className="flex items-center gap-8">
        <Link
          href="/"
          className={`text-sm font-medium transition-colors hover:text-white ${
            pathname === "/" ? "text-white" : "text-gray-500"
          }`}
        >
          Home
        </Link>
        {isSignedIn ? (
          <>
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-white ${
                pathname === "/dashboard" ? "text-white" : "text-gray-500"
              }`}
            >
              Dashboard
            </Link>
            <UserButton />
          </>
        ) : (
          <SignInButton mode="modal">
            <Button variant="outline" size="sm" className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold px-5">
              Sign in
            </Button>
          </SignInButton>
        )}
      </nav>
    </header>
  );
};

export default Nav;
