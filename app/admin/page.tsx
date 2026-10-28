import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPanel from "@/components/AdminPanel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-sm flex-1 px-4 py-16">
        <p className="text-zinc-600 dark:text-zinc-400">
          This account doesn&apos;t have admin access.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Round authoring</h1>
      <AdminPanel />
    </main>
  );
}
