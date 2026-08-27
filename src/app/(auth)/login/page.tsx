import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Plane } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Plane className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold text-white">AI Travel Budget Simulator</h1>
        <p className="text-sm text-slate-400">Sign in to build your next quotation.</p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-xs text-slate-500">
        Demo login: <span className="font-mono text-slate-400">agent@travelbuilder.demo</span> /{" "}
        <span className="font-mono text-slate-400">travelbuilder123</span>
      </p>
    </div>
  );
}
