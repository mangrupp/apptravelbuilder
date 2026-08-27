export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-slate-950 p-4">
      {children}
    </div>
  );
}
