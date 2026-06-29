import { connection } from "next/server";
import { MentoraApp } from "@/components/mentora-app";

export default async function Home() {
  await connection();

  return <MentoraApp />;
}
