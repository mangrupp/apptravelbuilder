import { auth } from "@/lib/auth/auth";

/** Server-side helper: returns the authenticated user's id, or null if unauthenticated. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
