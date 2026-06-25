import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { LoginLanding } from "@/components/LoginLanding";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/workspace");
  }

  return <LoginLanding />;
}
