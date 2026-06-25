import Link from "next/link";

export default function Custom404() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fbfb] px-6 text-slate-950">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-slate-600">This Mentora route is not available.</p>
        <Link className="mt-6 inline-flex rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" href="/">
          Back to Mentora
        </Link>
      </section>
    </main>
  );
}
