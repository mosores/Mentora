import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright";

const root = process.cwd();
const outputDir = path.join(root, ".qa");
let devServer;
let browser;

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

const results = [];

try {
  await mkdir(outputDir, { recursive: true });
  const targetUrl = process.env.QA_URL ?? await resolveLocalTarget();

  browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("A tree hydrated but some attributes")) {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForFunction(() => {
      const shell = document.querySelector(".mentora-shell, .landing-page, main");
      if (!shell) {
        return false;
      }

      return Number.parseFloat(window.getComputedStyle(shell).opacity || "1") > 0.95;
    }, { timeout: 10_000 });
    await page.waitForTimeout(900);
    const text = await page.locator("body").innerText({ timeout: 5_000 });
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      interactiveControls: document.querySelectorAll("button, a, input, label").length,
    }));

    const screenshot = path.join(outputDir, `${viewport.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
    await page.close();

    results.push({
      viewport,
      screenshot,
      textPreview: text.slice(0, 900),
      metrics,
      hasHorizontalOverflow: metrics.scrollWidth > metrics.clientWidth,
      errors,
    });
  }

  console.log(JSON.stringify(results, null, 2));

  if (results.some((result) => result.hasHorizontalOverflow || result.errors.length > 0)) {
    process.exitCode = 1;
  }
} finally {
  await browser?.close().catch(() => {});
  await stopDevServer();
}

async function resolveLocalTarget() {
  const configuredPort = process.env.QA_PORT ? Number.parseInt(process.env.QA_PORT, 10) : null;
  if (process.env.QA_PORT && (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65535)) {
    throw new Error("QA_PORT must be a valid TCP port number.");
  }

  const port = configuredPort ?? (await getAvailablePort());
  const targetUrl = `http://127.0.0.1:${port}`;
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  let serverOutput = "";
  let serverExit = null;

  devServer = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const captureOutput = (chunk) => {
    serverOutput = `${serverOutput}${chunk.toString()}`.slice(-4000);
  };

  devServer.stdout.on("data", captureOutput);
  devServer.stderr.on("data", captureOutput);
  devServer.once("exit", (code, signal) => {
    serverExit = `Next dev server exited with code ${code ?? "null"} and signal ${signal ?? "null"}.`;
  });

  await waitForServer(targetUrl, () => serverExit, () => serverOutput);
  return targetUrl;
}

async function isReachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function getAvailablePort() {
  const server = createServer();
  server.unref();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  if (!address || typeof address === "string") {
    throw new Error("Could not allocate a local QA port.");
  }

  return address.port;
}

async function waitForServer(url, readExit, readOutput) {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (await isReachable(url)) {
      return;
    }

    const serverExit = readExit();
    if (serverExit) {
      throw new Error(`${serverExit}\n${readOutput()}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for Next dev server at ${url}.\n${readOutput()}`);
}

async function stopDevServer() {
  if (!devServer || devServer.exitCode !== null || devServer.signalCode !== null) {
    return;
  }

  if (process.platform === "win32" && devServer.pid) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(devServer.pid), "/T", "/F"], { stdio: "ignore" });
      killer.once("exit", resolve);
      killer.once("error", resolve);
    });
    return;
  }

  devServer.kill("SIGTERM");
  await Promise.race([
    once(devServer, "exit"),
    new Promise((resolve) => setTimeout(resolve, 5000)).then(() => devServer.kill("SIGKILL")),
  ]);
}
