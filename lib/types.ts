export type UserRole = "student" | "admin";
export type UserStatus = "active" | "suspended";
export type StudyLanguage = "en" | "es" | "bilingual";
export type ToolType = "summary" | "flashcards" | "quiz" | "plan";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export type UserRecord = PublicUser & {
  passwordHash: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
};

export type StudySpaceRecord = {
  id: string;
  userId: string;
  title: string;
  course: string;
  language: StudyLanguage;
  createdAt: string;
  updatedAt: string;
};

export type DocumentRecord = {
  id: string;
  userId: string;
  spaceId: string;
  name: string;
  mimeType: string;
  text: string;
  summary: string;
  chunkCount: number;
  createdAt: string;
};

export type SourceCitation = {
  documentId: string;
  sourceName: string;
  chunkIndex: number;
};

export type ChunkRecord = SourceCitation & {
  id: string;
  userId: string;
  spaceId: string;
  text: string;
  keywords: string[];
  createdAt: string;
};

export type GeneratedToolRecord = {
  id: string;
  userId: string;
  spaceId: string;
  type: ToolType;
  title: string;
  content: unknown;
  createdAt: string;
};

export type ChatTurnRecord = {
  id: string;
  userId: string;
  spaceId: string;
  role: "user" | "assistant";
  content: string;
  citations: SourceCitation[];
  createdAt: string;
};

export type UsageEventRecord = {
  id: string;
  userId: string;
  spaceId?: string;
  type: string;
  provider: string;
  model: string;
  tokenEstimate: number;
  costEstimateUsd: number;
  createdAt: string;
};

export type MentoraDb = {
  users: UserRecord[];
  sessions: SessionRecord[];
  spaces: StudySpaceRecord[];
  documents: DocumentRecord[];
  chunks: ChunkRecord[];
  tools: GeneratedToolRecord[];
  chatTurns: ChatTurnRecord[];
  usageEvents: UsageEventRecord[];
};

export type SpaceSummary = StudySpaceRecord & {
  documentCount: number;
  chunkCount: number;
  chatTurnCount: number;
  toolCount: number;
};

export type SpaceDetail = SpaceSummary & {
  documents: DocumentRecord[];
  tools: GeneratedToolRecord[];
  chatTurns: ChatTurnRecord[];
};

export type WorkspaceSnapshot = {
  user: PublicUser;
  spaces: SpaceSummary[];
  selectedSpaceId: string | null;
  selectedSpace: SpaceDetail | null;
};

export type AdminSnapshot = {
  kpis: {
    users: number;
    activeUsers: number;
    studySpaces: number;
    documents: number;
    chunks: number;
    chatTurns: number;
    usageEvents: number;
    activeCourses: number;
  };
  users: Array<PublicUser & { spaceCount: number; documentCount: number; chatTurnCount: number }>;
  recentUsage: UsageEventRecord[];
};
