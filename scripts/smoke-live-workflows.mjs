const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

let cookie = "";

async function request(path, options = {}) {
  const headers = new Headers(options.headers ?? {});

  if (cookie) {
    headers.set("cookie", cookie);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    redirect: "manual"
  });

  const setCookie =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie")]
        : [];

  if (setCookie.length > 0) {
    cookie = setCookie.map((value) => value.split(";")[0]).join("; ");
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${body.error ?? text}`);
  }

  return body;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const suffix = Date.now();
const sampleText = `
La fotosintesis convierte luz solar, agua y dioxido de carbono en glucosa y oxigeno.
La clorofila absorbe energia luminosa en los cloroplastos. En la fase luminosa se produce ATP y NADPH.
En el ciclo de Calvin, la planta fija carbono para formar azucares. This bilingual note explains why light, chloroplasts, and carbon fixation matter for plant energy.
`;

console.log(`Smoke target: ${baseUrl}`);

await request("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "student@mentora.local", password: "mentora123" })
});

const created = await request("/api/spaces", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: `Smoke Biology ${suffix}`, course: "Smoke Test", language: "bilingual" })
});
assert(created.space?.id, "space id missing");

const form = new FormData();
form.set("title", `photosynthesis-${suffix}.txt`);
form.set("text", sampleText);

const uploaded = await request(`/api/spaces/${created.space.id}/documents`, {
  method: "POST",
  body: form
});
assert(uploaded.space?.documentCount >= 1, "document was not persisted");
assert(uploaded.space?.chunkCount >= 1, "chunks were not created");

const summary = await request(`/api/spaces/${created.space.id}/tools`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "summary" })
});
assert(summary.tool?.type === "summary", "summary tool was not generated");

const plan = await request(`/api/spaces/${created.space.id}/tools`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "plan" })
});
assert(plan.tool?.type === "plan", "study plan was not generated");

const chat = await request(`/api/spaces/${created.space.id}/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Why does chlorophyll matter in photosynthesis?" })
});

const assistantTurn = chat.turns?.find((turn) => turn.role === "assistant");
assert(assistantTurn?.content?.includes("Sources:"), "tutor did not return a grounded answer");
assert(assistantTurn?.citations?.length > 0, "tutor did not cite source chunks");

console.log("Smoke workflow passed: login, space, upload, tools, chat.");
