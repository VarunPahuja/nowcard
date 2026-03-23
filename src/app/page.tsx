import { SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>NowCard</h1>

      <div style={{ marginTop: 20 }}>
        <SignInButton />
      </div>

      <div style={{ marginTop: 20 }}>
        <UserButton />
      </div>
    </div>
  );
}