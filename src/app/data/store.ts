import { DEMO_ACCOUNTS, SEED_PROJECTS, type MonthlyReturn, type Project } from './model';

const KEYS = {
  users: 'rethabile.users',
  session: 'rethabile.session',
  projects: 'rethabile.projects',
  returns: 'rethabile.returns',
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

type StoredUser = SessionUser & {
  passwordHash: string;
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function ensureSeeded() {
  if (!localStorage.getItem(KEYS.users)) {
    const users: StoredUser[] = [];
    for (const account of DEMO_ACCOUNTS) {
      users.push({
        id: account.id,
        name: account.name,
        email: account.email.toLowerCase(),
        passwordHash: await sha256(account.password),
      });
    }
    writeJSON(KEYS.users, users);
  }
  if (!localStorage.getItem(KEYS.projects)) writeJSON(KEYS.projects, SEED_PROJECTS);
  if (!localStorage.getItem(KEYS.returns)) writeJSON(KEYS.returns, {});
}

function readUsers() {
  return readJSON<StoredUser[]>(KEYS.users, []);
}

export function loadSession(): SessionUser | null {
  const session = readJSON<SessionUser | null>(KEYS.session, null);
  if (!session?.id || !session.email || !session.name) return null;
  return session;
}

export function signOut() {
  localStorage.removeItem(KEYS.session);
}

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const users = readUsers();
  const hash = await sha256(password);
  const found = users.find(
    (user) => user.email === email.trim().toLowerCase() && user.passwordHash === hash,
  );
  if (!found) return null;
  const session = { id: found.id, name: found.name, email: found.email };
  writeJSON(KEYS.session, session);
  return session;
}

export async function resetPassword(email: string, password: string) {
  const users = readUsers();
  const index = users.findIndex((user) => user.email === email.trim().toLowerCase());
  if (index < 0) return false;
  users[index] = { ...users[index], passwordHash: await sha256(password) };
  writeJSON(KEYS.users, users);
  return true;
}

export function loadProjects() {
  const projects = readJSON<Project[]>(KEYS.projects, SEED_PROJECTS);
  return projects.length > 0 ? projects : SEED_PROJECTS;
}

export function loadReturn(projectId: string, month: string) {
  const all = readJSON<Record<string, MonthlyReturn>>(KEYS.returns, {});
  return all[`${projectId}:${month}`] ?? null;
}

export function saveReturn(ret: MonthlyReturn, projects: Project[]) {
  const all = readJSON<Record<string, MonthlyReturn>>(KEYS.returns, {});
  all[`${ret.projectId}:${ret.month}`] = ret;
  writeJSON(KEYS.returns, all);

  const phaseId = ret.phases.find((phase) => phase.status === 'In Progress')?.id;
  const stageId = ret.stages.find((stage) => stage.status === 'In Progress')?.id;
  const next = projects.map((project) =>
    project.id === ret.projectId
      ? {
          ...project,
          phaseId: phaseId ?? project.phaseId,
          stageId: stageId ?? project.stageId,
        }
      : project,
  );
  writeJSON(KEYS.projects, next);
  return next;
}
