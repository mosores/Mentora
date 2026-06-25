"use client";

import { ArrowLeft, BarChart3, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import type { AdminSnapshot, UserRole, UserStatus } from "@/lib/types";

async function patchUser(userId: string, patch: { role?: UserRole; status?: UserStatus }) {
  const response = await fetch("/api/admin/overview", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...patch })
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Could not update user");
  }

  return (await response.json()) as { snapshot: AdminSnapshot };
}

export function AdminClient({ initialSnapshot }: { initialSnapshot: AdminSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [busyUser, setBusyUser] = useState("");
  const [error, setError] = useState("");

  async function updateUser(userId: string, patch: { role?: UserRole; status?: UserStatus }) {
    setBusyUser(userId);
    setError("");

    try {
      const body = await patchUser(userId, patch);
      setSnapshot(body.snapshot);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update user");
    } finally {
      setBusyUser("");
    }
  }

  const kpis = [
    ["Users", snapshot.kpis.users],
    ["Active", snapshot.kpis.activeUsers],
    ["Spaces", snapshot.kpis.studySpaces],
    ["Documents", snapshot.kpis.documents],
    ["Chunks", snapshot.kpis.chunks],
    ["Chat turns", snapshot.kpis.chatTurns],
    ["Usage events", snapshot.kpis.usageEvents],
    ["Courses", snapshot.kpis.activeCourses]
  ];

  return (
    <main className="min-h-screen bg-[#f7fbfb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Mentora Admin</p>
              <p className="text-xs text-slate-500">Operations and user controls</p>
            </div>
          </div>
          <a
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300"
            href="/workspace"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Workspace
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-teal-700">
              <BarChart3 size={16} aria-hidden="true" />
              Live local data
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Operations dashboard</h1>
          </div>
        </div>

        {error ? <p className="mb-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(([label, value]) => (
            <div key={label as string} className="rounded-md border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label as string}</p>
              <p className="mt-3 text-3xl font-semibold">{value as number}</p>
            </div>
          ))}
        </section>

        <section className="mt-7 rounded-md border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <Users size={18} className="text-teal-700" aria-hidden="true" />
            <h2 className="font-semibold">Users</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Spaces</th>
                  <th className="px-5 py-3 font-semibold">Documents</th>
                  <th className="px-5 py-3 font-semibold">Chat</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.users.map((user) => (
                  <tr className="border-t border-slate-100" key={user.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        className="focus-ring rounded-md border border-slate-200 px-2 py-2"
                        disabled={busyUser === user.id}
                        onChange={(event) => updateUser(user.id, { role: event.target.value as UserRole })}
                        value={user.role}
                      >
                        <option value="student">student</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        className="focus-ring rounded-md border border-slate-200 px-2 py-2"
                        disabled={busyUser === user.id}
                        onChange={(event) => updateUser(user.id, { status: event.target.value as UserStatus })}
                        value={user.status}
                      >
                        <option value="active">active</option>
                        <option value="suspended">suspended</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">{user.spaceCount}</td>
                    <td className="px-5 py-4">{user.documentCount}</td>
                    <td className="px-5 py-4">{user.chatTurnCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
