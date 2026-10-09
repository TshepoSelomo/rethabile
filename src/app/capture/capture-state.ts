import { computed, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import {
  DEPARTMENTS,
  FUNDING_TYPES,
  HEALTH_STATUSES,
  PLP_PHASES,
  PORTFOLIOS,
  PRIORITIES,
  PROCUREMENT_STAGES,
  PROGRAMMES,
  PROJECT_STAGES,
  PROJECT_STATUSES,
  RECORD_STATUSES,
  REGIONS,
  RISK_LEVELS,
  SERVICE_LINES,
  blankReturn,
  clamp,
  currentMonth,
  daysLate,
  financialPeriod,
  formatMoney,
  formatMonth,
  formatPercent,
  formatWhen,
  jobsActual,
  jobsShortfall,
  type FinancialMonthly,
  type JobsMonthly,
  type Milestone,
  type MonthlyReturn,
  type ProcurementMonth,
  type Project,
  type TargetsActuals,
} from '../data/model';
import { loadProjects, loadReturn, loadSession, saveCapture } from '../data/store';

type PendingNav = {
  projectId: string;
  month: string;
};

type ProjectTextKey = 'financialYear' | 'number' | 'name' | 'manager';
type ProjectChoiceKey =
  | 'portfolio'
  | 'programme'
  | 'serviceLine'
  | 'region'
  | 'department'
  | 'fundingType'
  | 'priority'
  | 'plpPhase'
  | 'projectStage'
  | 'projectStatus'
  | 'riskLevel'
  | 'healthStatus';
type ProjectDateKey = 'plannedStart' | 'actualStart' | 'plannedCompletion' | 'actualCompletion';
type ProjectNumberKey = 'contractMonths' | 'dotAllocation' | 'rollOver' | 'baselineProjection' | 'stageCompletion';

const PAGE_TITLES: Record<string, string> = {
  overview: 'Overview',
  project: 'Project master',
  financials: 'Financial monthly',
  targets: 'Targets & actuals',
  jobs: 'Jobs monthly',
  milestones: 'Milestones',
  procurement: 'Procurement',
};

@Injectable()
export class CaptureState {
  private readonly router = inject(Router);

  readonly plpPhases = PLP_PHASES;
  readonly projectStages = PROJECT_STAGES;
  readonly projectStatuses = PROJECT_STATUSES;
  readonly riskLevels = RISK_LEVELS;
  readonly healthStatuses = HEALTH_STATUSES;
  readonly priorities = PRIORITIES;
  readonly portfolios = PORTFOLIOS;
  readonly programmes = PROGRAMMES;
  readonly serviceLines = SERVICE_LINES;
  readonly regions = REGIONS;
  readonly departments = DEPARTMENTS;
  readonly fundingTypes = FUNDING_TYPES;
  readonly procurementStages = PROCUREMENT_STAGES;
  readonly recordStatuses = RECORD_STATUSES;
  readonly formatMonth = formatMonth;
  readonly formatMoney = formatMoney;
  readonly formatPercent = formatPercent;
  readonly daysLate = daysLate;

  private readonly session = loadSession();
  private readonly start = initialCapture();

  readonly userName = this.session?.name ?? '';
  readonly projects = signal<Project[]>(this.start.projects);
  readonly projectId = signal(this.start.projectId);
  readonly month = signal(this.start.month);
  readonly project = signal<Project>(this.start.project);
  readonly form = signal<MonthlyReturn>(this.start.form);
  readonly snapshot = signal(this.start.snapshot);
  readonly notice = signal('');
  readonly pending = signal<PendingNav | null>(null);
  readonly pageTitle = signal(pageTitle(this.router.url));
  readonly projectQuery = signal('');

  readonly period = computed(() => financialPeriod(this.month()));
  readonly jobsActual = computed(() => jobsActual(this.form().jobs));
  readonly jobsShortfall = computed(() => jobsShortfall(this.form().jobs));
  readonly procurementLate = computed(() =>
    daysLate(this.form().procurement.plannedEnd, this.form().procurement.actualEnd),
  );
  readonly dirty = computed(() => this.pack(this.form(), this.project()) !== this.snapshot());
  readonly searchResults = computed(() => {
    const query = this.projectQuery().trim().toLowerCase();
    if (!query) return [];
    const compactQuery = query.replace(/\s+/g, '');
    return this.projects().filter((item) => {
      const name = item.name.toLowerCase();
      const number = item.number.toLowerCase();
      return name.includes(query) || number.includes(query) || number.replace(/\s+/g, '').includes(compactQuery);
    });
  });
  readonly statusLine = computed(() => {
    if (this.dirty()) return 'Unsaved changes';
    if (this.notice()) return this.notice();
    const updatedAt = this.form().updatedAt;
    return updatedAt ? `Saved ${formatWhen(updatedAt)}` : 'Not saved yet';
  });

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.pageTitle.set(pageTitle(this.router.url));
    });
  }

  choices(options: readonly string[], current: string) {
    if (current && !options.includes(current)) return [current, ...options];
    return options;
  }

  onProjectQuery(event: Event) {
    this.projectQuery.set((event.target as HTMLInputElement).value);
  }

  clearProjectQuery() {
    this.projectQuery.set('');
  }

  requestNav(nextProjectId: string, nextMonth: string) {
    if (nextProjectId === this.projectId() && nextMonth === this.month()) return;
    if (this.dirty()) {
      this.pending.set({ projectId: nextProjectId, month: nextMonth });
      return;
    }
    this.applyNav(nextProjectId, nextMonth);
  }

  keepEditing() {
    this.pending.set(null);
  }

  applyNav(nextProjectId: string, nextMonth: string, nextProjects = this.projects()) {
    const project = nextProjects.find((item) => item.id === nextProjectId) ?? nextProjects[0];
    const form = openReturn(project.id, nextMonth, nextProjects);
    this.projects.set(nextProjects);
    this.projectId.set(project.id);
    this.month.set(nextMonth);
    this.project.set(project);
    this.form.set(form);
    this.snapshot.set(this.pack(form, project));
    this.pending.set(null);
    this.notice.set('');
    this.projectQuery.set('');
  }

  discardPending() {
    const pending = this.pending();
    if (!pending) return;
    this.applyNav(pending.projectId, pending.month);
  }

  saveAndContinue() {
    const nextProjects = this.persist('draft');
    const pending = this.pending();
    if (!pending || !nextProjects) return;
    this.applyNav(pending.projectId, pending.month, nextProjects);
  }

  persist(status: MonthlyReturn['status']) {
    const form = this.form();
    const project = {
      ...this.project(),
      stageCompletion: clamp(this.project().stageCompletion, 0, 100),
    };
    const saved: MonthlyReturn = {
      ...form,
      projectId: project.id,
      month: this.month(),
      targets: {
        ...form.targets,
        plannedProgress: clamp(form.targets.plannedProgress, 0, 100),
        actualProgress: clamp(form.targets.actualProgress, 0, 100),
      },
      milestones: form.milestones.map((item) => ({ ...item, weight: clamp(item.weight, 0, 100) })),
      status,
      submittedBy: status === 'submitted' ? this.userName : form.submittedBy,
      submittedAt: status === 'submitted' ? new Date().toISOString() : form.submittedAt,
      updatedAt: new Date().toISOString(),
    };
    try {
      const nextProjects = saveCapture(saved, project, this.projects());
      this.projects.set(nextProjects);
      this.project.set(project);
      this.form.set(saved);
      this.snapshot.set(this.pack(saved, project));
      this.notice.set(
        status === 'submitted'
          ? `Submitted. ${this.userName} is recorded on this return.`
          : `Draft saved for ${project.name}, ${formatMonth(this.month())}.`,
      );
      return nextProjects;
    } catch {
      this.notice.set('Could not save on this device.');
      return null;
    }
  }

  setText(key: ProjectTextKey, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.project.update((current) => ({ ...current, [key]: value }));
    this.notice.set('');
  }

  setChoice(key: ProjectChoiceKey, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.project.update((current) => ({ ...current, [key]: value }));
    this.notice.set('');
  }

  setDate(key: ProjectDateKey, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.project.update((current) => ({ ...current, [key]: value }));
    this.notice.set('');
  }

  setProjectNumber(key: ProjectNumberKey, value: number) {
    const next = key === 'stageCompletion' ? clamp(value, 0, 100) : value;
    this.project.update((current) => ({ ...current, [key]: next }));
    this.notice.set('');
  }

  setFinancial(key: keyof FinancialMonthly, value: number) {
    this.form.update((current) => ({
      ...current,
      financials: { ...current.financials, [key]: value },
    }));
    this.notice.set('');
  }

  setTargetNumber(key: 'plannedProgress' | 'actualProgress', value: number) {
    this.form.update((current) => ({
      ...current,
      targets: { ...current.targets, [key]: clamp(value, 0, 100) },
    }));
    this.notice.set('');
  }

  setTargetText(key: keyof Pick<TargetsActuals, 'plannedDeliverables' | 'actualDeliverables' | 'notes'>, event: Event) {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.form.update((current) => ({
      ...current,
      targets: { ...current.targets, [key]: value },
    }));
    this.notice.set('');
  }

  setJob(key: keyof Omit<JobsMonthly, 'notes'>, value: number) {
    this.form.update((current) => ({
      ...current,
      jobs: { ...current.jobs, [key]: value },
    }));
    this.notice.set('');
  }

  setJobNotes(event: Event) {
    const notes = (event.target as HTMLTextAreaElement).value;
    this.form.update((current) => ({ ...current, jobs: { ...current.jobs, notes } }));
    this.notice.set('');
  }

  setProcurementStage(event: Event) {
    this.patchProcurement({ stage: (event.target as HTMLSelectElement).value });
  }

  setProcurementStatus(event: Event) {
    this.patchProcurement({ status: (event.target as HTMLSelectElement).value });
  }

  setProcurementDate(key: 'plannedStart' | 'plannedEnd' | 'actualStart' | 'actualEnd', event: Event) {
    this.patchProcurement({ [key]: (event.target as HTMLInputElement).value });
  }

  setProcurementComments(event: Event) {
    this.patchProcurement({ comments: (event.target as HTMLTextAreaElement).value });
  }

  addMilestone() {
    this.form.update((current) => ({
      ...current,
      milestones: [
        ...current.milestones,
        {
          id: crypto.randomUUID(),
          code: `MS-${current.milestones.length + 1}`,
          name: '',
          type: '',
          plannedDate: '',
          actualDate: '',
          status: 'Not Started',
          weight: 0,
          responsible: '',
          comments: '',
        },
      ],
    }));
    this.notice.set('');
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('.milestone-name');
      inputs[inputs.length - 1]?.focus();
    });
  }

  removeMilestone(id: string) {
    this.form.update((current) => ({
      ...current,
      milestones: current.milestones.filter((item) => item.id !== id),
    }));
    this.notice.set('');
  }

  onMilestoneText(
    id: string,
    key: 'code' | 'name' | 'type' | 'responsible' | 'comments',
    event: Event,
  ) {
    this.patchMilestone(id, { [key]: (event.target as HTMLInputElement).value });
  }

  onMilestoneDate(id: string, key: 'plannedDate' | 'actualDate', event: Event) {
    this.patchMilestone(id, { [key]: (event.target as HTMLInputElement).value });
  }

  onMilestoneStatus(id: string, event: Event) {
    this.patchMilestone(id, { status: (event.target as HTMLSelectElement).value });
  }

  onMilestoneWeight(id: string, event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    const next = raw === '' ? 0 : Number(raw);
    this.patchMilestone(id, { weight: clamp(Number.isFinite(next) ? next : 0, 0, 100) });
  }

  private patchProcurement(patch: Partial<ProcurementMonth>) {
    this.form.update((current) => ({
      ...current,
      procurement: { ...current.procurement, ...patch },
    }));
    this.notice.set('');
  }

  private patchMilestone(id: string, patch: Partial<Milestone>) {
    this.form.update((current) => ({
      ...current,
      milestones: current.milestones.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
    this.notice.set('');
  }

  private pack(form: MonthlyReturn, project: Project) {
    return JSON.stringify({ form, project });
  }
}

function pageTitle(url: string) {
  const path = url.split('?')[0].split('/').filter(Boolean).pop() ?? 'overview';
  return PAGE_TITLES[path] ?? 'Overview';
}

function initialCapture() {
  const projects = loadProjects();
  const project = projects[0];
  const month = currentMonth();
  const form = openReturn(project.id, month, projects);
  return { projects, projectId: project.id, month, project, form, snapshot: JSON.stringify({ form, project }) };
}

function openReturn(projectId: string, month: string, projects: Project[]) {
  const existing = loadReturn(projectId, month);
  if (existing) return existing;
  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  return blankReturn(project, month);
}
