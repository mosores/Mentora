"use client";

import {
  BookOpen,
  Bot,
  ClipboardList,
  FileText,
  Layers,
  LogOut,
  MessageSquare,
  Plus,
  Send,
  Shield,
  Sparkles,
  Upload
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { formatShortDate } from "@/lib/dates";
import type { GeneratedToolRecord, SpaceDetail, ToolType, WorkspaceSnapshot } from "@/lib/types";

type ApiError = {
  error?: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(body?.error ?? "Request failed");
  }

  return (await response.json()) as T;
}

function replaceSelectedSpace(snapshot: WorkspaceSnapshot, space: SpaceDetail): WorkspaceSnapshot {
  return {
    ...snapshot,
    selectedSpaceId: space.id,
    selectedSpace: space,
    spaces: [space, ...snapshot.spaces.filter((candidate) => candidate.id !== space.id)].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    )
  };
}

function renderToolContent(tool: GeneratedToolRecord) {
  if (tool.type === "summary") {
    const content = tool.content as { overview: string; keyTerms: string[]; sourceCount: number };
    return (
      <div className="space-y-3">
        <p className="leading-7 text-slate-700">{content.overview}</p>
        <div className="flex flex-wrap gap-2">
          {content.keyTerms.map((term) => (
            <span key={term} className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
              {term}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (tool.type === "flashcards") {
    const cards = tool.content as Array<{ front: string; back: string }>;
    return (
      <div className="grid gap-3">
        {cards.map((card, index) => (
          <div key={`${card.front}-${index}`} className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-950">{card.front}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.back}</p>
          </div>
        ))}
      </div>
    );
  }

  if (tool.type === "quiz") {
    const questions = tool.content as Array<{ question: string; options: string[]; answerIndex: number }>;
    return (
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={`${question.question}-${index}`} className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-950">{index + 1}. {question.question}</p>
            <p className="mt-2 text-sm leading-6 text-teal-800">{question.options[question.answerIndex]}</p>
          </div>
        ))}
      </div>
    );
  }

  const plan = tool.content as Array<{ day: number; task: string; focus: string[] }>;
  return (
    <div className="space-y-3">
      {plan.map((item) => (
        <div key={item.day} className="flex gap-4 rounded-md border border-slate-200 bg-white p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
            {item.day}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">{item.task}</p>
            <p className="mt-1 text-xs text-slate-500">{item.focus.join(", ") || "Review source concepts"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WorkspaceClient({ initialSnapshot }: { initialSnapshot: WorkspaceSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [materialTitle, setMaterialTitle] = useState("Class notes");
  const [materialText, setMaterialText] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedSpace = snapshot.selectedSpace;
  const latestTool = selectedSpace?.tools[0] ?? null;

  const metrics = useMemo<Array<[string, number, LucideIcon]>>(
    () => [
      ["Documents", selectedSpace?.documentCount ?? 0, FileText],
      ["Chunks", selectedSpace?.chunkCount ?? 0, Layers],
      ["Tools", selectedSpace?.toolCount ?? 0, ClipboardList],
      ["Chat turns", selectedSpace?.chatTurnCount ?? 0, MessageSquare]
    ],
    [selectedSpace]
  );

  function setSpace(space: SpaceDetail) {
    setSnapshot((current) => replaceSelectedSpace(current, space));
  }

  async function refreshSpace(spaceId: string) {
    const body = await requestJson<{ space: SpaceDetail }>(`/api/spaces/${spaceId}`);
    setSpace(body.space);
  }

  async function withBusy(label: string, action: () => Promise<void>) {
    setBusy(label);
    setError("");
    setNotice("");

    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setBusy("");
    }
  }

  async function createSpace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await withBusy("Creating space", async () => {
      const body = await requestJson<{ space: SpaceDetail }>("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, course: newCourse, language: "bilingual" })
      });
      setSpace(body.space);
      setNewTitle("");
      setNewCourse("");
      setNotice("Study space created.");
    });
  }

  async function uploadMaterial(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpace) {
      return;
    }

    await withBusy("Uploading material", async () => {
      const formData = new FormData();
      const file = fileRef.current?.files?.[0];

      if (file) {
        formData.append("file", file);
      }

      formData.append("title", materialTitle);
      formData.append("text", materialText);

      const body = await requestJson<{ space: SpaceDetail }>(`/api/spaces/${selectedSpace.id}/documents`, {
        method: "POST",
        body: formData
      });
      setSpace(body.space);
      setMaterialText("");

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      setNotice("Material uploaded and chunked.");
    });
  }

  async function generateTool(type: ToolType) {
    if (!selectedSpace) {
      return;
    }

    await withBusy(`Generating ${type}`, async () => {
      const body = await requestJson<{ space: SpaceDetail }>(`/api/spaces/${selectedSpace.id}/tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      setSpace(body.space);
      setNotice("Study tool generated.");
    });
  }

  async function sendChat(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSpace || !chatMessage.trim()) {
      return;
    }

    await withBusy("Asking tutor", async () => {
      const body = await requestJson<{ space: SpaceDetail }>(`/api/spaces/${selectedSpace.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage })
      });
      setSpace(body.space);
      setChatMessage("");
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-[#f7fbfb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-600 text-white">
              <BookOpen size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Mentora</p>
              <p className="text-xs text-slate-500">{snapshot.user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {snapshot.user.role === "admin" ? (
              <a
                className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300"
                href="/admin"
              >
                <Shield size={16} aria-hidden="true" />
                Admin
              </a>
            ) : null}
            <button
              className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300"
              onClick={logout}
              type="button"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <aside className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs-shadow">
            <h2 className="text-sm font-semibold text-slate-950">Study spaces</h2>
            <div className="mt-4 space-y-2">
              {snapshot.spaces.map((space) => (
                <button
                  className={`focus-ring w-full rounded-md px-3 py-3 text-left transition ${
                    selectedSpace?.id === space.id ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700 hover:bg-teal-50"
                  }`}
                  key={space.id}
                  onClick={() => refreshSpace(space.id)}
                  type="button"
                >
                  <span className="block text-sm font-semibold">{space.title}</span>
                  <span className={selectedSpace?.id === space.id ? "mt-1 block text-xs text-slate-300" : "mt-1 block text-xs text-slate-500"}>
                    {space.course} · {space.documentCount} docs
                  </span>
                </button>
              ))}
            </div>
          </section>

          <form className="rounded-md border border-slate-200 bg-white p-4 shadow-xs-shadow" onSubmit={createSpace}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Plus size={16} aria-hidden="true" />
              New space
            </h2>
            <div className="mt-4 space-y-3">
              <input
                className="focus-ring w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Linear Algebra"
                required
                value={newTitle}
              />
              <input
                className="focus-ring w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                onChange={(event) => setNewCourse(event.target.value)}
                placeholder="Course"
                required
                value={newCourse}
              />
              <button
                className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                disabled={Boolean(busy)}
                type="submit"
              >
                <Plus size={16} aria-hidden="true" />
                Create
              </button>
            </div>
          </form>
        </aside>

        <section className="min-w-0">
          {selectedSpace ? (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <p className="text-sm font-medium text-teal-700">{selectedSpace.course}</p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-semibold tracking-0 text-slate-950 sm:text-4xl">{selectedSpace.title}</h1>
                    <p className="mt-2 text-sm text-slate-500">Updated {formatShortDate(selectedSpace.updatedAt)}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">
                    <Sparkles size={16} aria-hidden="true" />
                    Source-grounded mode
                  </div>
                </div>
              </div>

              {(error || notice || busy) ? (
                <div
                  className={`rounded-md px-4 py-3 text-sm ${
                    error ? "bg-red-50 text-red-700" : busy ? "bg-slate-950 text-white" : "bg-teal-50 text-teal-800"
                  }`}
                >
                  {error || busy || notice}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-4">
                {metrics.map(([label, value, Icon]) => (
                  <div key={label as string} className="rounded-md border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label as string}</p>
                      <Icon size={16} className="text-teal-700" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold">{value as number}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.65fr)]">
                <div className="space-y-6">
                  <form className="rounded-md border border-slate-200 bg-white p-5" onSubmit={uploadMaterial}>
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                      <Upload size={18} className="text-teal-700" aria-hidden="true" />
                      Add material
                    </h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-[0.7fr_1fr]">
                      <input
                        className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm"
                        onChange={(event) => setMaterialTitle(event.target.value)}
                        value={materialTitle}
                      />
                      <input className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm" ref={fileRef} type="file" />
                    </div>
                    <textarea
                      className="focus-ring mt-3 min-h-36 w-full resize-y rounded-md border border-slate-200 px-3 py-3 text-sm leading-6"
                      onChange={(event) => setMaterialText(event.target.value)}
                      placeholder="Paste lecture notes, textbook excerpts, or assignment source material here."
                      value={materialText}
                    />
                    <button
                      className="focus-ring mt-3 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      disabled={Boolean(busy)}
                      type="submit"
                    >
                      <Upload size={16} aria-hidden="true" />
                      Upload and process
                    </button>
                  </form>

                  <section className="rounded-md border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="flex items-center gap-2 text-base font-semibold">
                        <ClipboardList size={18} className="text-teal-700" aria-hidden="true" />
                        Study tools
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {(["summary", "flashcards", "quiz", "plan"] as ToolType[]).map((type) => (
                          <button
                            className="focus-ring rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-800"
                            disabled={Boolean(busy)}
                            key={type}
                            onClick={() => generateTool(type)}
                            type="button"
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      {latestTool ? (
                        <article>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-950">{latestTool.title}</h3>
                            <span className="text-xs text-slate-500">{formatShortDate(latestTool.createdAt)}</span>
                          </div>
                          {renderToolContent(latestTool)}
                        </article>
                      ) : (
                        <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                          Upload material, then generate a summary, flashcards, quiz, or plan.
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                <section className="flex min-h-[640px] flex-col rounded-md border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 p-5">
                    <h2 className="flex items-center gap-2 text-base font-semibold">
                      <Bot size={18} className="text-teal-700" aria-hidden="true" />
                      Tutor chat
                    </h2>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {selectedSpace.chatTurns.length === 0 ? (
                      <p className="rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        Ask a question about the selected material. Answers cite uploaded chunks when Mentora finds a match.
                      </p>
                    ) : (
                      selectedSpace.chatTurns.map((turn) => (
                        <div
                          className={`rounded-md p-4 text-sm leading-6 ${
                            turn.role === "user" ? "ml-8 bg-slate-950 text-white" : "mr-8 bg-teal-50 text-slate-800"
                          }`}
                          key={turn.id}
                        >
                          <p className="whitespace-pre-wrap">{turn.content}</p>
                          {turn.citations.length > 0 ? (
                            <p className="mt-3 text-xs text-teal-900">
                              {turn.citations.map((citation) => `${citation.sourceName} #${citation.chunkIndex}`).join("; ")}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>

                  <form className="border-t border-slate-200 p-4" onSubmit={sendChat}>
                    <div className="flex gap-2">
                      <input
                        className="focus-ring min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
                        onChange={(event) => setChatMessage(event.target.value)}
                        placeholder="Ask from this study space"
                        value={chatMessage}
                      />
                      <button
                        className="focus-ring inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                        disabled={Boolean(busy)}
                        type="submit"
                      >
                        <Send size={16} aria-hidden="true" />
                        Ask
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-white p-8">
              <h1 className="text-2xl font-semibold">Create your first study space</h1>
              <p className="mt-2 text-slate-600">Use the form on the left to start a course workspace.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
