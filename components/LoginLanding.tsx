import { LoginForm } from "@/components/LoginForm";
import { LoginHero } from "@/components/LoginHero";

export function LoginLanding() {
  return (
    <main className="min-h-screen">
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <LoginHero />
        <LoginForm />
      </section>
    </main>
  );
}
