import { redirect } from "next/navigation";
import { AuthError, requireAdmin } from "@/lib/auth";
import { getAdminSnapshot } from "@/lib/workspace";
import { AdminClient } from "@/components/AdminClient";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/");
    }

    throw error;
  }

  const snapshot = await getAdminSnapshot();
  return <AdminClient initialSnapshot={snapshot} />;
}
