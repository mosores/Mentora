import { redirect } from "next/navigation";
import { AuthError, requireUser } from "@/lib/auth";
import { getWorkspaceSnapshot } from "@/lib/workspace";
import { WorkspaceClient } from "@/components/WorkspaceClient";

export default async function WorkspacePage() {
  let user;

  try {
    ({ user } = await requireUser());
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/");
    }

    throw error;
  }

  const snapshot = await getWorkspaceSnapshot(user);
  return <WorkspaceClient initialSnapshot={snapshot} />;
}
