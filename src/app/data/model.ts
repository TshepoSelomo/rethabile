export type TrackStatus = 'Not Started' | 'In Progress' | 'Complete';

export type MilestoneStatus = 'Not started' | 'In progress' | 'Achieved' | 'Delayed';

export type TrackRow = {
  id: string;
  name: string;
  weight: number | null;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  status: TrackStatus;
};

export type Milestone = {
  id: string;
  name: string;
  planned: string;
  actual: string;
  status: MilestoneStatus;
};

export type Financials = {
  approvedBudget: number;
  expenditureToDate: number;
  expenditureThisMonth: number;
  commitments: number;
  forecastToComplete: number;
};

export type Jobs = {
  planned: number;
  createdToDate: number;
  thisMonth: number;
  local: number;
  youth: number;
  women: number;
};

export type ReturnStatus = 'draft' | 'submitted';

export type MonthlyReturn = {
  projectId: string;
  month: string;
  financials: Financials;
  progressPercent: number;
  jobs: Jobs;
  milestones: Milestone[];
  phases: TrackRow[];
  stages: TrackRow[];
  status: ReturnStatus;
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  code: string;
  name: string;
  phaseId: string;
  stageId: string;
};

export type DemoAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export const PLP_PHASES = [
  { id: 'ph1', name: 'Initiation', weight: 5 },
  { id: 'ph2', name: 'Planning', weight: 10 },
  { id: 'ph3', name: 'Design', weight: 15 },
  { id: 'ph4', name: 'Implementation', weight: 50 },
  { id: 'ph5', name: 'Handover', weight: 15 },
  { id: 'ph6', name: 'Close-out', weight: 5 },
] as const;

export const PROCUREMENT_STAGES = [
  { id: 'pre-bsc', name: 'Pre-BSC' },
  { id: 'bsc', name: 'BSC' },
  { id: 'advert', name: 'Advertisement' },
  { id: 'briefing', name: 'Briefing' },
  { id: 'closing', name: 'Closing' },
  { id: 'bec', name: 'BEC' },
  { id: 'bac', name: 'BAC' },
  { id: 'award', name: 'Award' },
] as const;

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'u-thabo',
    name: 'Thabo Mokoena',
    email: 'manager@rethabile.gov',
    password: 'rethabile',
  },
  {
    id: 'u-lerato',
    name: 'Lerato Nkosi',
    email: 'lerato@rethabile.gov',
    password: 'rethabile',
  },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'hall',
    code: 'RH-014',
    name: 'Community Hall — Ward 4',
    phaseId: 'ph4',
    stageId: 'advert',
  },
  {
    id: 'water',
    code: 'RH-021',
    name: 'Water reticulation phase 2',
    phaseId: 'ph3',
    stageId: 'bec',
  },
  {
    id: 'road',
    code: 'RH-008',
    name: 'Access road upgrade',
    phaseId: 'ph5',
    stageId: 'award',
  },
  {
    id: 'clinic',
    code: 'RH-033',
    name: 'Clinic extension',
    phaseId: 'ph2',
    stageId: 'bsc',
  },
];

export const TRACK_STATUSES: TrackStatus[] = ['Not Started', 'In Progress', 'Complete'];

export const MILESTONE_STATUSES: MilestoneStatus[] = [
  'Not started',
  'In progress',
  'Achieved',
  'Delayed',
];

export function phaseOptionLabel(index: number) {
  const phase = PLP_PHASES[index];
  return `Phase ${index + 1} — ${phase.name} (${phase.weight}%)`;
}

export function cascadeStatus<T extends { id: string; status: TrackStatus }>(
  rows: T[],
  currentId: string,
): T[] {
  const index = rows.findIndex((row) => row.id === currentId);
  if (index < 0) return rows;
  return rows.map((row, i) => ({
    ...row,
    status: i < index ? 'Complete' : i === index ? 'In Progress' : 'Not Started',
  }));
}

function blankTrack(
  defs: readonly { id: string; name: string; weight?: number }[],
  currentId: string,
): TrackRow[] {
  const rows: TrackRow[] = defs.map((def) => ({
    id: def.id,
    name: def.name,
    weight: def.weight ?? null,
    plannedStart: '',
    plannedEnd: '',
    actualStart: '',
    actualEnd: '',
    status: 'Not Started',
  }));
  return cascadeStatus(rows, currentId);
}

export function blankReturn(project: Project, month: string): MonthlyReturn {
  return {
    projectId: project.id,
    month,
    financials: {
      approvedBudget: 0,
      expenditureToDate: 0,
      expenditureThisMonth: 0,
      commitments: 0,
      forecastToComplete: 0,
    },
    progressPercent: 0,
    jobs: {
      planned: 0,
      createdToDate: 0,
      thisMonth: 0,
      local: 0,
      youth: 0,
      women: 0,
    },
    milestones: [],
    phases: blankTrack(PLP_PHASES, project.phaseId),
    stages: blankTrack(PROCUREMENT_STAGES, project.stageId),
    status: 'draft',
    submittedBy: '',
    submittedAt: '',
    updatedAt: '',
  };
}

export type ProgressResult = {
  total: number;
  prior: number;
  added: number;
  index: number;
  percentOfPhase: number;
};

/** Earlier phases count in full. The in-progress phase adds weight × % of phase. */
export function weightedProgress(phases: TrackRow[], percentOfPhase: number): ProgressResult {
  const percent = clamp(percentOfPhase, 0, 100);
  const index = phases.findIndex((phase) => phase.status === 'In Progress');
  if (index < 0) {
    const total = phases
      .filter((phase) => phase.status === 'Complete')
      .reduce((sum, phase) => sum + (phase.weight ?? 0), 0);
    return { total, prior: total, added: 0, index: -1, percentOfPhase: percent };
  }
  const prior = phases.slice(0, index).reduce((sum, phase) => sum + (phase.weight ?? 0), 0);
  const added = (phases[index].weight ?? 0) * (percent / 100);
  return { total: prior + added, prior, added, index, percentOfPhase: percent };
}

export function progressStory(phases: TrackRow[], result: ProgressResult) {
  if (result.index < 0) {
    return `Completed phases contribute ${formatPercent(result.total)}. Choose the phase in progress to add a partial weight.`;
  }
  const phaseNo = result.index + 1;
  const weight = phases[result.index].weight ?? 0;
  const partial = `${formatPercent(result.added)} (${formatPercent(result.percentOfPhase)} of its ${weight}% weight)`;
  if (result.index === 0) {
    return `Phase 1 contributes ${partial}.`;
  }
  const priorLabel =
    result.index === 1
      ? `Phase 1 counts in full (${formatPercent(result.prior)})`
      : `Phases 1–${result.index} count in full (${formatPercent(result.prior)})`;
  return `${priorLabel}. Phase ${phaseNo} adds ${partial}.`;
}

export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonth(month: string) {
  const [year, m] = month.split('-').map(Number);
  if (!year || !m) return month;
  return new Date(year, m - 1, 1).toLocaleDateString('en-ZA', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number) {
  const rounded = Number(value.toFixed(1));
  return `${rounded}%`;
}

export function formatWhen(iso: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function statusSlug(status: string) {
  return status.toLowerCase().replace(/\s+/g, '-');
}
