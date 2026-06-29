"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

const AUTH_COOKIE_EXPIRY_MARGIN_MS = 60_000;

type BrowserClientConfig = {
  supabaseAnonKey?: string;
  supabaseUrl?: string;
};

function getAuthStorageKey(supabaseUrl: string) {
  return `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
}

function getCookieValue(name: string) {
  return getCookieEntries().find((cookie) => cookie.name === name)?.value ?? null;
}

function getCookieEntries() {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      const name = separatorIndex >= 0 ? part.slice(0, separatorIndex) : part;
      const value = separatorIndex >= 0 ? part.slice(separatorIndex + 1) : "";

      try {
        return { name, value: decodeURIComponent(value) };
      } catch {
        return { name, value };
      }
    });
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const bytes = Uint8Array.from(window.atob(padded), (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function readAuthCookie(storageKey: string) {
  const directValue = getCookieValue(storageKey);
  if (directValue) {
    return directValue;
  }

  const chunkPrefix = `${storageKey}.`;
  const chunks = getCookieEntries()
    .filter((cookie) => cookie.name.startsWith(chunkPrefix))
    .map((cookie) => ({
      index: Number(cookie.name.slice(chunkPrefix.length)),
      value: cookie.value,
    }))
    .filter((cookie) => Number.isInteger(cookie.index) && cookie.index >= 0)
    .sort((left, right) => left.index - right.index);

  if (chunks.length === 0 || chunks[0].index !== 0) {
    return null;
  }

  return chunks.map((chunk) => chunk.value).join("");
}

function clearAuthStorage(storageKey: string) {
  const authCookiePrefix = `${storageKey}.`;
  const existingCookieNames = getCookieEntries()
    .map((cookie) => cookie.name)
    .filter((name) => (
      name === storageKey ||
      name === `${storageKey}-code-verifier` ||
      name === `${storageKey}-user` ||
      name.startsWith(authCookiePrefix)
    ));
  const names = new Set([
    storageKey,
    `${storageKey}-code-verifier`,
    `${storageKey}-user`,
    ...existingCookieNames,
  ]);

  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    try {
      window.localStorage.removeItem(name);
      window.sessionStorage.removeItem(name);
    } catch {
      // Ignore storage restrictions; expiring the cookie is the important part.
    }
  }
}

function clearExpiredAuthSession(supabaseUrl: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const storageKey = getAuthStorageKey(supabaseUrl);
    const rawCookie = readAuthCookie(storageKey);
    if (!rawCookie) {
      return;
    }

    const rawSession = rawCookie.startsWith("base64-")
      ? decodeBase64Url(rawCookie.slice("base64-".length))
      : rawCookie;
    const session = JSON.parse(rawSession) as { expires_at?: number };

    if (!session.expires_at || session.expires_at * 1000 - Date.now() < AUTH_COOKIE_EXPIRY_MARGIN_MS) {
      clearAuthStorage(storageKey);
    }
  } catch {
    clearAuthStorage(getAuthStorageKey(supabaseUrl));
  }
}

export function createClient(config: BrowserClientConfig = {}) {
  const supabaseUrl = config.supabaseUrl || publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = config.supabaseAnonKey || publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  clearExpiredAuthSession(supabaseUrl);

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (input, init) => {
        try {
          return await fetch(input, init);
        } catch {
          return new Response(JSON.stringify({ error: "Network connection unavailable." }), {
            headers: { "Content-Type": "application/json" },
            status: 503,
            statusText: "Service Unavailable",
          });
        }
      },
    },
  });
}
