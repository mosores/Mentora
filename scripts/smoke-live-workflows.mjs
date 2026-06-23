import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = new URL(process.env.MENTORA_BASE_URL ?? "http://localhost:3000");
const adminToken = process.env.MENTORA_ADMIN_API_TOKEN;
const keepData = process.env.MENTORA_SMOKE_KEEP_DATA === "1";
const requestTimeoutMs = Number(process.env.MENTORA_SMOKE_TIMEOUT_MS ?? "30000");
const shouldRestoreData =
  !keepData && ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname);
const dbPath = path.join(process.cwd(), ".mentora-data", "mentora-db.json");
const startedAt = new Date().toISOString().replace(/[:.]/g, "-");

const checks = [];
const skipped = [];

async function main() {
  const originalDb = shouldRestoreData ? await readOptionalFile(dbPath) : null;
  const created = {};
  let primaryStudent;
  let secondStudent;
  let admin;

  try {
    await check("unauthenticated core API requests are rejected", async () => {
      await expectStatus("/api/study-spaces", 401);

      const formData = new FormData();
      formData.set("studySpaceId", "space-smoke-missing");
      formData.set("language", "en");
      formData.set("manualText", "This unauthenticated upload should be rejected before processing.");

      await expectStatus("/api/documents/upload", 401, {
        method: "POST",
        body: formData
      });
      await expectStatus("/api/ai/chat", 401, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studySpaceId: "space-smoke-missing",
          language: "en",
          mode: "source_strict",
          message: "Should this be rejected?"
        })
      });
      await expectStatus("/api/ai/generate-study-plan", 401, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studySpaceId: "space-smoke-missing",
          language: "en",
          days: 7
        })
      });
    });

    await check("login workflow creates student session", async () => {
      primaryStudent = await login(`smoke-student-${startedAt}@mentora.local`);
      assert(primaryStudent.user?.role === "student", "Expected smoke student role.");
      assert(primaryStudent.token, "Expected smoke student session token.");

      const me = await requestJson("/api/auth/me", {
        headers: authHeaders(primaryStudent.token)
      });
      assert(me.user?.email === primaryStudent.user.email, "Expected /api/auth/me to return logged-in student.");
    });

    await check("server responds with study spaces for logged-in student", async () => {
      const body = await requestJson("/api/study-spaces", {
        headers: authHeaders(primaryStudent.token)
      });
      assert(Array.isArray(body.studySpaces), "Expected studySpaces array.");
    });

    await check("study space create workflow uses session token", async () => {
      const body = await requestJson("/api/study-spaces", {
        method: "POST",
        headers: authHeaders(primaryStudent.token, { "content-type": "application/json" }),
        body: JSON.stringify({
          title: `Smoke Space ${startedAt}`,
          courseName: "QA 101",
          institution: "Mentora Smoke",
          language: "en"
        })
      });

      assert(body.studySpace?.id, "Expected created studySpace id.");
      assert(body.studySpace.title.startsWith("Smoke Space"), "Expected smoke title in response.");
      assert(body.studySpace.ownerUserId === primaryStudent.user.id, "Expected study space owner to be logged-in student.");
      created.studySpaceId = body.studySpace.id;
    });

    await check("study space list includes created item for owner", async () => {
      const body = await requestJson("/api/study-spaces", {
        headers: authHeaders(primaryStudent.token)
      });
      const found = body.studySpaces.find((space) => space.id === created.studySpaceId);
      assert(found, "Created study space was not returned by owner list.");
    });

    await check("student isolation hides and blocks another student's space", async () => {
      secondStudent = await login(`smoke-other-${startedAt}@mentora.local`);
      assert(secondStudent.user?.role === "student", "Expected second smoke user to be a student.");

      const listBody = await requestJson("/api/study-spaces", {
        headers: authHeaders(secondStudent.token)
      });
      const leaked = listBody.studySpaces.find((space) => space.id === created.studySpaceId);
      assert(!leaked, "Second student could see another student's study space.");

      const formData = new FormData();
      formData.set("studySpaceId", created.studySpaceId);
      formData.set("language", "en");
      formData.set("manualText", "This upload should not be allowed for a different student.");

      await expectStatus("/api/documents/upload", 404, {
        method: "POST",
        headers: authHeaders(secondStudent.token),
        body: formData
      });
      await expectStatus("/api/ai/chat", 404, {
        method: "POST",
        headers: authHeaders(secondStudent.token, { "content-type": "application/json" }),
        body: JSON.stringify({
          studySpaceId: created.studySpaceId,
          language: "en",
          mode: "source_strict",
          message: "Can I access this?"
        })
      });
      await expectStatus("/api/ai/generate-study-plan", 404, {
        method: "POST",
        headers: authHeaders(secondStudent.token, { "content-type": "application/json" }),
        body: JSON.stringify({
          studySpaceId: created.studySpaceId,
          language: "en",
          days: 7
        })
      });
    });

    await check("admin overview requires admin user session", async () => {
      await expectStatus("/api/admin/overview", 401);
      await expectStatus("/api/admin/overview", 403, {
        headers: authHeaders(primaryStudent.token)
      });

      admin = await login(`admin-smoke-${startedAt}@mentora.local`);
      assert(admin.user?.role === "admin", "Expected admin smoke user role.");

      const body = await requestJson("/api/admin/overview", {
        headers: authHeaders(admin.token)
      });

      assert(Number.isInteger(body.stats?.userCount), "Expected admin overview stats.userCount.");
      assert(body.stats.userCount >= 3, "Expected admin overview to count smoke users.");
      assert(Array.isArray(body.users), "Expected admin overview users array.");
      assert(body.users.some((user) => user.email === primaryStudent.user.email), "Expected users to include smoke student.");
      assert(body.users.some((user) => user.email === admin.user.email), "Expected users to include smoke admin.");
    });

    await check("admin can update user status and role", async () => {
      await expectStatus(`/api/admin/users/${secondStudent.user.id}`, 403, {
        method: "PATCH",
        headers: authHeaders(primaryStudent.token, { "content-type": "application/json" }),
        body: JSON.stringify({ status: "disabled" })
      });

      const disabled = await requestJson(`/api/admin/users/${secondStudent.user.id}`, {
        method: "PATCH",
        headers: authHeaders(admin.token, { "content-type": "application/json" }),
        body: JSON.stringify({ status: "disabled" })
      });
      assert(disabled.user?.status === "disabled", "Expected admin to disable another user.");

      const promoted = await requestJson(`/api/admin/users/${secondStudent.user.id}`, {
        method: "PATCH",
        headers: authHeaders(admin.token, { "content-type": "application/json" }),
        body: JSON.stringify({ role: "admin", status: "active" })
      });
      assert(promoted.user?.role === "admin", "Expected admin to promote user role.");
      assert(promoted.user?.status === "active", "Expected admin to reactivate user.");
    });

    await check("manual text upload workflow uses session token", async () => {
      const formData = new FormData();
      formData.set("studySpaceId", created.studySpaceId);
      formData.set("language", "en");
      formData.set(
        "manualText",
        [
          "Cellular respiration converts glucose into ATP through glycolysis, the Krebs cycle, and oxidative phosphorylation.",
          "Mitochondria host the Krebs cycle and the electron transport chain where oxidative phosphorylation happens.",
          "ATP production depends on oxygen as the final electron acceptor."
        ].join(" ")
      );

      const body = await requestJson("/api/documents/upload", {
        method: "POST",
        headers: authHeaders(primaryStudent.token),
        body: formData
      });

      assert(body.document?.id, "Expected uploaded document id.");
      assert(body.document.status === "ready", "Expected uploaded document to be ready.");
      assert(body.document.chunks?.length > 0, "Expected uploaded document chunks.");
      assert(body.document.summary?.length > 0, "Expected generated summary.");
      assert(body.document.flashcards?.length > 0, "Expected generated flashcards.");
      assert(body.document.quiz?.length > 0, "Expected generated quiz.");
      created.documentId = body.document.id;
      created.documentName = body.document.name;
    });

    await check("tutor chat workflow returns grounded answer with citations", async () => {
      const body = await requestJson("/api/ai/chat", {
        method: "POST",
        headers: authHeaders(primaryStudent.token, { "content-type": "application/json" }),
        body: JSON.stringify({
          studySpaceId: created.studySpaceId,
          language: "en",
          mode: "source_strict",
          message: "Where does oxidative phosphorylation happen, and why is oxygen important?"
        })
      });

      assert(body.answer?.length > 0, "Expected tutor answer.");
      assert(body.provider, "Expected provider in chat response.");
      assert(body.model, "Expected model in chat response.");
      assert(Array.isArray(body.citations), "Expected citations array.");
      assert(body.citations.length > 0, "Expected at least one citation.");
      assert(
        body.citations.includes(created.documentName ?? "Manual study note"),
        "Expected citations to include uploaded manual note."
      );
      assertIncludesAny(body.answer, ["Mitochondria", "electron transport chain", "oxidative phosphorylation"]);
      assertIncludesAny(body.answer, ["oxygen", "final electron acceptor", "ATP"]);
      assert(/\[\d+\]/.test(body.answer) || /Sources:/i.test(body.answer), "Expected answer to include source markers.");
    });

    await check("study plan generation workflow uses uploaded documents", async () => {
      const body = await requestJson("/api/ai/generate-study-plan", {
        method: "POST",
        headers: authHeaders(primaryStudent.token, { "content-type": "application/json" }),
        body: JSON.stringify({
          studySpaceId: created.studySpaceId,
          language: "en",
          days: 7
        })
      });

      assert(body.plan?.includes("Personalized study plan"), "Expected generated study plan title.");
      assert(body.documentCount > 0, "Expected plan to use uploaded documents.");
    });

    await check("provider list workflow", async () => {
      let body;

      try {
        body = await requestJson("/api/admin/ai/providers", {
          headers: admin?.token ? authHeaders(admin.token) : adminToken ? { "x-admin-token": adminToken } : undefined
        });
      } catch (error) {
        if (!admin?.token && !adminToken && error.message.startsWith("404 Not Found")) {
          skipped.push(
            "provider list workflow (admin API disabled; set ADMIN_API_TOKEN on the app and MENTORA_ADMIN_API_TOKEN for smoke)"
          );
          return;
        }

        throw error;
      }

      assert(body.providers?.mock, "Expected mock provider.");
      assert(body.providers.mock.enabled === true, "Expected mock provider to be enabled.");
      assert(Array.isArray(body.providers.mock.models), "Expected provider models array.");
    });
  } finally {
    if (shouldRestoreData) {
      await restoreFile(dbPath, originalDb);
    }
  }

  console.log(`Smoke workflows passed against ${baseUrl.origin}`);
  for (const item of checks) {
    console.log(`ok - ${item}`);
  }
  for (const item of skipped) {
    console.log(`skipped - ${item}`);
  }
}

async function check(name, fn) {
  try {
    await fn();
    checks.push(name);
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}

async function login(email) {
  const body = await requestJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email })
  });

  assert(body.user?.email === email.toLowerCase(), `Expected login response for ${email}.`);
  assert(body.token, `Expected login token for ${email}.`);
  return body;
}

function authHeaders(token, extra) {
  return {
    ...extra,
    Authorization: `Bearer ${token}`
  };
}

async function expectStatus(pathname, status, init) {
  const response = await request(pathname, init);
  const text = await response.text();

  if (response.status !== status) {
    throw new Error(`Expected ${status} from ${pathname}, received ${response.status}: ${text.slice(0, 500)}`);
  }
}

async function requestJson(pathname, init) {
  const response = await request(pathname, init);
  const text = await response.text();
  let body = {};

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
      }

      throw new Error(`Expected JSON from ${response.url}, received: ${text.slice(0, 500)}`);
    }
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  return body;
}

async function request(pathname, init) {
  const url = new URL(pathname, baseUrl);
  const requestInit = {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(requestTimeoutMs)
  };

  try {
    return await fetch(url, requestInit);
  } catch (error) {
    throw new Error(
      `Could not reach ${url.href}. Start the app first, for example with npm run dev. ${error.message}`
    );
  }
}

async function readOptionalFile(filePath) {
  try {
    await access(filePath);
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function restoreFile(filePath, contents) {
  if (contents === null) {
    await rm(filePath, { force: true });
    return;
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludesAny(value, expected) {
  const normalized = String(value ?? "").toLowerCase();
  const matched = expected.some((item) => normalized.includes(item.toLowerCase()));

  if (!matched) {
    throw new Error(`Expected text to include one of: ${expected.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});


