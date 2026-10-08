import { computed, inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import {
  MILESTONE_STATUSES,
  PLP_PHASES,
  PROCUREMENT_STAGES,
  blankReturn,
  cascadeStatus,
  clamp,
  currentMonth,
  formatMoney,
  formatMonth,
  formatWhen,
  phaseOptionLabel,
  weightedProgress,
  type Financials,
  type Jobs,
  type Milestone,
  type MonthlyReturn,
  type Project,
  type TrackRow,
} from '../data/model';
import { loadProjects, loadReturn, loadSession, saveReturn } from '../data/store';

type PendingNav = {
  projectId: string;
  month: string;
};

const PAGE_TITLES: Record<string, string> = {
  overview: 'Overview',
  financials: 'Financials',
  jobs: 'Jobs',
  milestones: 'Milestones',
  procurement: 'Procurement',
  phases: 'PLP phases',
};

@Injectable()
export class CaptureState {
  private readonly router = inject(Router);

  readonly phases = PLP_PHASES;
  readonly stages = PROCUREMENT_STAGES;
  readonly milestoneStatuses = MILESTONE_STATUSES;
  readonly phaseOptionLabel = phaseOptionLabel;
  readonly formatMonth = formatMonth;
  readonly formatMoney = formatMoney;

  private readonly session = loadSession();
  private readonly start = initialCapture();

  readonly userName = this.session?.name ?? '';
  readonly projects = signal<Project[]>(this.start.projects);
  readonly projectId = signal(this.start.projectId);
  readonly month = signal(this.start.month);
  readonly form = signal<MonthlyReturn>(this.start.form);
  readonly snapshot = signal(this.start.snapshot);
  readonly notice = signal('');
  readonly pending = signal<PendingNav | null>(null);
  readonly pageTitle = signal(pageTitle(this.router.url));

  readonly project = computed(
    () => this.projects().find((item) => item.id === this.projectId()) ?? this.projects()[0],
  );
  readonly progress = computed(() => weightedProgress(this.form().phases, this.form().progressPercent));
  readonly currentPhase = computed(
    () => this.form().phases.find((phase) => phase.status === 'In Progress') ?? null,
  );
  readonly currentStage = computed(
    () => this.form().stages.find((stage) => stage.status === 'In Progress') ?? null,
  );
  readonly balance = computed(
    () => this.form().financials.approvedBudget - this.form().financials.expenditureToDate,
  );
  readonly statusLine = computed(() => {
    if (JSON.stringify(this.form()) !== this.snapshot()) return 'Unsaved changes';
    if (this.notice()) return this.notice();
    const updatedAt = this.form().updatedAt;
    return updatedAt ? `Saved ${formatWhen(updatedAt)}` : 'Not saved yet';
  });

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.pageTitle.set(pageTitle(this.router.url));
    });
  }

  requestNav(nextProjectId: string, nextMonth: string) {
    if (nextProjectId === this.projectId() && nextMonth === this.month()) return;
    if (JSON.stringify(this.form()) !== this.snapshot()) {
      this.pending.set({ projectId: nextProjectId, month: nextMonth });
      return;
    }
    this.applyNav(nextProjectId, nextMonth);
  }

  keepEditing() {
    this.pending.set(null);
  }

  applyNav(nextProjectId: string, nextMonth: string, nextProjects = this.projects()) {
    const next = openReturn(nextProjectId, nextMonth, nextProjects);
    this.projectId.set(nextProjectId);
    this.month.set(nextMonth);
    this.form.set(next);
    this.snapshot.set(JSON.stringify(next));
    this.pending.set(null);
    this.notice.set('');
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
    const saved: MonthlyReturn = {
      ...form,
      progressPercent: clamp(form.progressPercent, 0, 100),
      status,
      submittedBy: status === 'submitted' ? this.userName : form.submittedBy,
      submittedAt: status === 'submitted' ? new Date().toISOString() : form.submittedAt,
      updatedAt: new Date().toISOString(),
    };
    try {
      const nextProjects = saveReturn(saved, this.projects());
      this.projects.set(nextProjects);
      this.form.set(saved);
      this.snapshot.set(JSON.stringify(saved));
      this.notice.set(
        status === 'submitted'
          ? `Submitted. ${this.userName} is recorded on this return.`
          : `Draft saved for ${this.project().name}, ${formatMonth(this.month())}.`,
      );
      return nextProjects;
    } catch {
      this.notice.set('Could not save on this device.');
      return null;
    }
  }

  setPhase(phaseId: string) {
    this.form.update((current) => ({ ...current, phases: cascadeStatus(current.phases, phaseId) }));
    this.notice.set('');
  }

  setStage(stageId: string) {
    this.form.update((current) => ({ ...current, stages: cascadeStatus(current.stages, stageId) }));
    this.notice.set('');
  }

  onPhaseSelect(event: Event) {
    this.setPhase((event.target as HTMLSelectElement).value);
  }

  onStageSelect(event: Event) {
    this.setStage((event.target as HTMLSelectElement).value);
  }

  onPhaseChange(change: { id: string; patch: Partial<TrackRow> }) {
    this.patchPhase(change.id, change.patch);
  }

  onStageChange(change: { id: string; patch: Partial<TrackRow> }) {
    this.patchStage(change.id, change.patch);
  }

  setFinancial(key: keyof Financials, value: number) {
    this.form.update((current) => ({
      ...current,
      financials: { ...current.financials, [key]: value },
    }));
  }

  setProgress(value: number) {
    this.form.update((current) => ({ ...current, progressPercent: clamp(value, 0, 100) }));
    this.notice.set('');
  }

  setJob(key: keyof Jobs, value: number) {
    this.form.update((current) => ({
      ...current,
      jobs: { ...current.jobs, [key]: value },
    }));
  }

  onMilestoneName(id: string, event: Event) {
    this.patchMilestone(id, { name: (event.target as HTMLInputElement).value });
  }

  onMilestoneDate(id: string, key: 'planned' | 'actual', event: Event) {
    this.patchMilestone(id, { [key]: (event.target as HTMLInputElement).value });
  }

  onMilestoneStatus(id: string, event: Event) {
    this.patchMilestone(id, {
      status: (event.target as HTMLSelectElement).value as Milestone['status'],
    });
  }

  removeMilestone(id: string) {
    this.form.update((current) => ({
      ...current,
      milestones: current.milestones.filter((item) => item.id !== id),
    }));
    this.notice.set('');
  }

  addMilestone() {
    this.form.update((current) => ({
      ...current,
      milestones: [
        ...current.milestones,
        {
          id: crypto.randomUUID(),
          name: '',
          planned: '',
          actual: '',
          status: 'Not started',
        },
      ],
    }));
    this.notice.set('');
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('.milestone-name');
      inputs[inputs.length - 1]?.focus();
    });
  }

  private patchPhase(id: string, patch: Partial<TrackRow>) {
    if (patch.status === 'In Progress') {
      this.setPhase(id);
      return;
    }
    this.form.update((current) => ({
      ...current,
      phases: current.phases.map((phase) => (phase.id === id ? { ...phase, ...patch } : phase)),
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

  private patchStage(id: string, patch: Partial<TrackRow>) {
    if (patch.status === 'In Progress') {
      this.setStage(id);
      return;
    }
    this.form.update((current) => ({
      ...current,
      stages: current.stages.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)),
    }));
    this.notice.set('');
  }
}

function pageTitle(url: string) {
  const path = url.split('?')[0].split('/').filter(Boolean).pop() ?? 'overview';
  return PAGE_TITLES[path] ?? 'Overview';
}

function initialCapture() {
  const projects = loadProjects();
  const projectId = projects[0].id;
  const month = currentMonth();
  const form = openReturn(projectId, month, projects);
  return { projects, projectId, month, form, snapshot: JSON.stringify(form) };
}

function openReturn(projectId: string, month: string, projects: Project[]) {
  const existing = loadReturn(projectId, month);
  if (existing) return existing;
  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  return blankReturn(project, month);
}
