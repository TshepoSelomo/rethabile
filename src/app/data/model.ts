import { SEED_MONTHS } from './returns.seed';

export type Project = {
  id: string;
  financialYear: string;
  number: string;
  name: string;
  portfolio: string;
  programme: string;
  serviceLine: string;
  region: string;
  department: string;
  manager: string;
  fundingType: string;
  priority: string;
  plpPhase: string;
  projectStage: string;
  projectStatus: string;
  riskLevel: string;
  healthStatus: string;
  plannedStart: string;
  actualStart: string;
  plannedCompletion: string;
  actualCompletion: string;
  contractMonths: number;
  dotAllocation: number;
  rollOver: number;
  baselineProjection: number;
  stageCompletion: number;
};

export type FinancialMonthly = {
  monthlyBudget: number;
  monthlyBaseline: number;
  monthlyExpenditure: number;
  monthlyCommitment: number;
  monthlyForecast: number;
};

export type TargetsActuals = {
  plannedProgress: number;
  actualProgress: number;
  plannedDeliverables: string;
  actualDeliverables: string;
  notes: string;
};

export type JobsMonthly = {
  planned: number;
  male: number;
  female: number;
  youth: number;
  above35: number;
  pld: number;
  foreign: number;
  notes: string;
};

export type ProcurementMonth = {
  stage: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  status: string;
  comments: string;
};

export type Milestone = {
  id: string;
  code: string;
  name: string;
  type: string;
  plannedDate: string;
  actualDate: string;
  status: string;
  weight: number;
  responsible: string;
  comments: string;
};

export type MonthlyReturn = {
  projectId: string;
  month: string;
  financials: FinancialMonthly;
  targets: TargetsActuals;
  jobs: JobsMonthly;
  procurement: ProcurementMonth;
  milestones: Milestone[];
  status: 'draft' | 'submitted';
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
};

export type SeedMonth = {
  financials?: Partial<FinancialMonthly>;
  targets?: Partial<TargetsActuals>;
  jobs?: Partial<JobsMonthly>;
  procurement?: Partial<ProcurementMonth>;
};

export type FinancialPeriod = {
  financialYear: string;
  financialMonth: number;
  quarter: number;
  monthName: string;
  label: string;
};

/** Lifecycle order from the Project Master values. */
export const PLP_PHASES = [
  'Portfolio Planning',
  'Pre-Feasibility',
  'Feasibility',
  'Implementation',
  'Commissioning & Handover',
  'Close-Out',
] as const;

export const PROJECT_STAGES = [
  'Initiation',
  'Planning',
  'Design',
  'Procurement',
  'Execution',
  'Close Out',
] as const;

export const PROJECT_STATUSES = ['In Progress', 'Delayed', 'On Hold', 'Completed', 'Cancelled'] as const;

export const RISK_LEVELS = ['Low', 'Medium', 'High'] as const;

export const HEALTH_STATUSES = ['Healthy', 'At Risk', 'Critical'] as const;

/** High is the only priority filled in the workbook. Medium and Low match the risk scale. */
export const PRIORITIES = ['High', 'Medium', 'Low'] as const;

export const PORTFOLIOS = ['Infrastructure'] as const;

export const PROGRAMMES = [
  'CIP - Bridges and stuctures',
  'CIP - OHTE Programme',
  'CIP - Perway (Rail) Programme',
  'CIP - Signalling and Telecoms',
  'CIP - Substations',
  'Commercialisation',
  'Depot Modernisation',
  'EPCM',
  'ERP/SAP',
  'Energy',
  'General Overhaul of Metrorail Coaches',
  'IT Systems',
  'Intersite (REAM)',
  'LDPT',
  'Mabopane Line Recovery - Walling',
  'National Station Improvement (NSIP)',
  'Protection Services',
  'Railbound',
  'Rolling Stock - Locomotives',
  'Rolling Stock - Tools',
  'Rolling Stock Fleet Renewal (RSFRP)',
  'SI - Bridges and stuctures',
  'SI - Level Crossings',
  'SI - OHTE',
  'SI - Platform Rectification',
  'SI - Substations',
  'Signalling and Telecoms Programme',
  'Station Modernisation',
  'Ticketing',
  'Vehicle Flet Replacement',
  'WC Central Line Recovery',
  'Work Place Improvement',
] as const;

export const SERVICE_LINES = [
  'Cape Town - Bellvile (Sarepta)',
  'Cape Town - Kapteinsklip',
  'Cape Town - Khayelitsha/Chris Hani',
  'Cape Town - Simonstown (Wynberg)',
  'Catoridge - Durban',
  'Daveyton - Dunswart - Germiston',
  'De Wildt - Belle Ombre',
  'Durban - KwaMashu (incl. Bridge City)',
  'Durban - Umlazi',
  'East London - Berlin',
  'Germiston - Vereeniging',
  'Kwesine - Germiston',
  'Leralla - Johannesburg',
  'Mabopane - Pretoria',
  'Naledi - Johannesburg',
  'National',
  'Non - Corridor',
  'Pienaarspoort - Pretoria',
  'Pinetown - Durban',
  'Pretoria - Kaalfontein',
  'Randfontein - Johannesburg',
  'Saulsville - Pretoria',
  'Vereeniging - George Goch (via Midway)',
] as const;

export const REGIONS = ['Eastern Cape', 'Gauteng', 'KwaZulu-Natal', 'National', 'Western Cape'] as const;

export const DEPARTMENTS = ['Asset Protection', 'Fleet', 'Group Capital', 'ICT', 'LDPT'] as const;

export const FUNDING_TYPES = [
  'General Overhaul',
  'Other Capital',
  'Rolling Stock Fleet Renewal Programme',
  'Signaling Programme',
] as const;

/** Read Me workflow, plus CONTRACTING which is filled on the Procurement sheet. */
export const PROCUREMENT_STAGES = ['PRE-BSC', 'BSC', 'ADVERT', 'BEC', 'BAC', 'AWARD', 'CONTRACTING'] as const;

export const RECORD_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Delayed', 'On Hold'] as const;

export const DEMO_ACCOUNTS = [
  {
    id: 'user-thabo',
    name: 'Thabo Mokoena',
    email: 'manager@rethabile.gov',
    password: 'rethabile',
  },
  {
    id: 'user-lerato',
    name: 'Lerato Nkosi',
    email: 'lerato@rethabile.gov',
    password: 'rethabile',
  },
];

export function financialPeriod(month: string): FinancialPeriod {
  const [year, m] = month.split('-').map(Number);
  if (!year || !m) {
    return { financialYear: '', financialMonth: 0, quarter: 0, monthName: month, label: month };
  }
  const fyStart = m >= 4 ? year : year - 1;
  const financialMonth = m >= 4 ? m - 3 : m + 9;
  const quarter = Math.ceil(financialMonth / 3);
  const monthName = new Date(year, m - 1, 1).toLocaleDateString('en-ZA', {
    month: 'long',
    year: 'numeric',
  });
  const financialYear = `FY ${fyStart}/${String(fyStart + 1).slice(-2)}`;
  return {
    financialYear,
    financialMonth,
    quarter,
    monthName,
    label: `${monthName} · ${financialYear} · Month ${financialMonth} · FQ${quarter}`,
  };
}

export function jobsActual(jobs: JobsMonthly) {
  return jobs.male + jobs.female;
}

export function jobsShortfall(jobs: JobsMonthly) {
  return jobs.planned - jobsActual(jobs);
}

export function daysLate(planned: string, actual: string) {
  if (!planned) return 0;
  const plannedDate = new Date(`${planned}T00:00:00`);
  if (Number.isNaN(plannedDate.getTime())) return 0;
  const end = actual ? new Date(`${actual}T00:00:00`) : new Date();
  if (Number.isNaN(end.getTime())) return 0;
  end.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - plannedDate.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export function blankReturn(project: Project, month: string): MonthlyReturn {
  const seed = SEED_MONTHS[`${project.id}:${month}`];
  return {
    projectId: project.id,
    month,
    financials: {
      monthlyBudget: 0,
      monthlyBaseline: 0,
      monthlyExpenditure: 0,
      monthlyCommitment: 0,
      monthlyForecast: 0,
      ...seed?.financials,
    },
    targets: {
      plannedProgress: 0,
      actualProgress: 0,
      plannedDeliverables: '',
      actualDeliverables: '',
      notes: '',
      ...seed?.targets,
    },
    jobs: {
      planned: 0,
      male: 0,
      female: 0,
      youth: 0,
      above35: 0,
      pld: 0,
      foreign: 0,
      notes: '',
      ...seed?.jobs,
    },
    procurement: {
      stage: '',
      plannedStart: '',
      plannedEnd: '',
      actualStart: '',
      actualEnd: '',
      status: '',
      comments: '',
      ...seed?.procurement,
    },
    milestones: [],
    status: 'draft',
    submittedBy: '',
    submittedAt: '',
    updatedAt: '',
  };
}

export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonth(month: string) {
  return financialPeriod(month).monthName;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2,
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
