import { SignupForm } from "@/components/signup-form";

export default function LoginPage() {
  return (
    <div
      className="
      relative flex min-h-svh flex-col items-center justify-center 
      p-6 md:p-10 bg-[url('/login-background.jpg')] bg-repeat bg-center
    "
    >
      <div className="absolute inset-0 bg-black/95" />

      <div className="relative w-full max-w-sm md:max-w-l">
        <SignupForm />
      </div>
    </div>
  );
}
