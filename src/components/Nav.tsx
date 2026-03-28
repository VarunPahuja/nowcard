"use client";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";

const Nav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <span
        className="text-foreground font-semibold text-lg tracking-tight cursor-pointer"
        onClick={() => router.push("/")}
      >
        NowCard
      </span>
      <nav className="flex items-center gap-4">
        <NavLink
          href="/how-to"
          className={`text-sm transition-colors hover:text-foreground ${
            pathname === "/how-to" ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          How it works
        </NavLink>
        {isSignedIn ? (
          <>
            <NavLink
              href="/dashboard"
              className={`text-sm transition-colors hover:text-foreground ${
                pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </NavLink>
            <UserButton />
          </>
        ) : (
          <SignInButton mode="modal">
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </SignInButton>
        )}
      </nav>
    </header>
  );
};

export default Nav;
