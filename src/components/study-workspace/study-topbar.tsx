"use client";

import {
  BarChart3,
  ChevronDown,
  LogOut,
  Moon,
  Plus,
  Settings2,
  Share2,
  Sun,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import type { DocumentRecord, Profile, StudySpace } from "@/lib/types";

export type ThemeMode = "light" | "dark";

type StudyTopbarProps = {
  activeSpace: StudySpace | null;
  documents: DocumentRecord[];
  onCreateSpace: (name: string) => Promise<string | null>;
  onOpenProfile: () => void;
  onOpenProgress: () => void;
  onSelectSpace: (spaceId: string) => void;
  onSignOut: () => void;
  onThemeModeChange: (mode: ThemeMode) => void;
  profile: Profile | null;
  readyCount: number;
  spaces: StudySpace[];
  themeMode: ThemeMode;
};

export function StudyTopbar({
  activeSpace,
  documents,
  onCreateSpace,
  onOpenProfile,
  onOpenProgress,
  onSelectSpace,
  onSignOut,
  onThemeModeChange,
  profile,
  readyCount,
  spaces,
  themeMode,
}: StudyTopbarProps) {
  const title = activeSpace?.name ?? "Untitled notebook";
  const studentName = profile?.full_name ?? profile?.email ?? "Student";
  const initials = getInitials(studentName);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function createSpace() {
    const name = window.prompt("Notebook name", title === "Untitled notebook" ? "" : title);
    if (name?.trim()) {
      await onCreateSpace(name.trim());
    }
  }

  async function shareWorkspace() {
    const shareData = { title: "Mentora", text: title, url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
  }

  function openProfile() {
    setSettingsOpen(false);
    setProfileMenuOpen(false);
    onOpenProfile();
  }

  return (
    <header className="notebook-topbar relative flex min-h-16 items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="notebook-brand-mark flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black">
          M
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="notebook-title truncate text-xl font-semibold leading-tight sm:text-2xl">{title}</h1>
            {spaces.length > 1 && activeSpace && (
              <label className="notebook-space-select hidden min-w-32 items-center rounded-full px-2 text-xs font-semibold md:flex">
                <span className="sr-only">Switch notebook</span>
                <select
                  className="h-8 min-w-0 max-w-44 bg-transparent outline-none"
                  onChange={(event) => onSelectSpace(event.target.value)}
                  value={activeSpace.id}
                >
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <p className="notebook-subtitle mt-0.5 text-xs font-medium">
            {documents.length} sources - {readyCount} ready
          </p>
        </div>
      </div>

      <div className="notebook-action-cluster flex min-w-0 shrink-0 items-center gap-2">
        <button className="notebook-create-button" onClick={createSpace} type="button">
          <Plus size={18} />
          <span>Create notebook</span>
        </button>
        <button className="notebook-action-button hidden md:inline-flex" onClick={onOpenProgress} type="button">
          <BarChart3 size={17} />
          <span>Analytics</span>
        </button>
        <button className="notebook-action-button hidden sm:inline-flex" onClick={() => void shareWorkspace()} type="button">
          <Share2 size={17} />
          <span>Share</span>
        </button>
        <div className="relative">
          <button
            aria-expanded={settingsOpen}
            className="notebook-action-button"
            onClick={() => {
              setSettingsOpen((current) => !current);
              setProfileMenuOpen(false);
            }}
            type="button"
          >
            <Settings2 size={17} />
            <span className="hidden lg:inline">Settings</span>
          </button>
          {settingsOpen && (
            <div className="notebook-popover notebook-settings-popover absolute right-0 top-[calc(100%+10px)] z-50 w-72 rounded-2xl p-3">
              <div className="mb-3">
                <p className="text-sm font-semibold">Settings</p>
                <p className="mt-1 text-xs">Tune the notebook workspace.</p>
              </div>
              <div className="notebook-setting-row">
                <span>Appearance</span>
                <div className="notebook-theme-toggle" role="group" aria-label="Theme mode">
                  <button
                    aria-pressed={themeMode === "light"}
                    className={themeMode === "light" ? "is-active" : ""}
                    onClick={() => onThemeModeChange("light")}
                    type="button"
                  >
                    <Sun size={14} />
                    Light
                  </button>
                  <button
                    aria-pressed={themeMode === "dark"}
                    className={themeMode === "dark" ? "is-active" : ""}
                    onClick={() => onThemeModeChange("dark")}
                    type="button"
                  >
                    <Moon size={14} />
                    Dark
                  </button>
                </div>
              </div>
              <button className="notebook-menu-item mt-3" onClick={openProfile} type="button">
                <Settings2 size={15} />
                Profile and learning settings
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            aria-expanded={profileMenuOpen}
            className="notebook-avatar-button"
            onClick={() => {
              setProfileMenuOpen((current) => !current);
              setSettingsOpen(false);
            }}
            title={studentName}
            type="button"
          >
            <span>{initials}</span>
            <ChevronDown className="hidden sm:block" size={14} />
          </button>
          {profileMenuOpen && (
            <div className="notebook-popover absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-2xl p-2 text-sm">
              <div className="border-b border-[var(--nb-border)] px-2.5 py-2">
                <p className="truncate font-semibold">{studentName}</p>
                <p className="truncate text-xs">{profile?.email}</p>
              </div>
              <button className="notebook-menu-item mt-2" onClick={openProfile} type="button">
                <UserRound size={15} />
                Profile
              </button>
              <button
                className="notebook-menu-item is-danger"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onSignOut();
                }}
                type="button"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase() || "M";
}
