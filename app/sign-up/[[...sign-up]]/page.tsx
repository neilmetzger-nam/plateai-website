import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
      <a href="/" className="mb-8 text-2xl font-bold">
        <span className="text-white">Plate</span>
        <span className="text-orange-500">AI</span>
      </a>
      <SignUp />
    </div>
  );
}
