import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
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
import { loadProjects, loadReturn, saveReturn, type SessionUser } from '../data/store';
import { NumberField } from '../number-field/number-field';
import { SideNav, type CaptureSection } from '../side-nav/side-nav';
import { SummaryPanel } from '../summary-panel/summary-panel';
import { TrackSection } from '../track-section/track-section';

type PendingNav = {
  projectId: string;
  month: string;
};

@Component({
  selector: 'app-capture',
  standalone: true,
  imports: [NumberField, TrackSection, SummaryPanel, SideNav],
  templateUrl: './capture.html',
})
export class Capture {
  private readonly title = inject(Title);
  private readonly projectSelect = viewChild<ElementRef<HTMLSelectElement>>('projectSelect');
  private readonly monthInput = viewChild<ElementRef<HTMLInputElement>>('monthInput');

  readonly user = input.required<SessionUser>();
  readonly signedOut = output<void>();

  protected readonly phases = PLP_PHASES;
  protected readonly stages = PROCUREMENT_STAGES;
  protected readonly milestoneStatuses = MILESTONE_STATUSES;
  protected readonly phaseOptionLabel = phaseOptionLabel;
  protected readonly formatMonth = formatMonth;
  protected readonly formatMoney = formatMoney;
  protected readonly formatWhen = formatWhen;

  private readonly start = initialCapture();

  protected readonly projects = signal<Project[]>(this.start.projects);
  protected readonly projectId = signal(this.start.projectId);
  protected readonly month = signal(this.start.month);
  protected readonly form = signal<MonthlyReturn>(this.start.form);
  protected readonly snapshot = signal(this.start.snapshot);
  protected readonly notice = signal('');
  protected readonly section = signal<CaptureSection>('overview');
  protected readonly pageTitle = computed(() => {
    const titles: Record<CaptureSection, string> = {
      overview: 'Overview',
      financials: 'Financials',
      jobs: 'Jobs',
      milestones: 'Milestones',
      procurement: 'Procurement',
      phases: 'PLP phases',
    };
    return titles[this.section()];
  });
  protected readonly pending = signal<PendingNav | null>(null);

  protected readonly project = computed(
    () => this.projects().find((item) => item.id === this.projectId()) ?? this.projects()[0],
  );
  protected readonly dirty = computed(() => JSON.stringify(this.form()) !== this.snapshot());
  protected readonly progress = computed(() =>
    weightedProgress(this.form().phases, this.form().progressPercent),
  );
  protected readonly currentPhase = computed(
    () => this.form().phases.find((phase) => phase.status === 'In Progress') ?? null,
  );
  protected readonly currentStage = computed(
    () => this.form().stages.find((stage) => stage.status === 'In Progress') ?? null,
  );
  protected readonly balance = computed(
    () => this.form().financials.approvedBudget - this.form().financials.expenditureToDate,
  );
  protected readonly statusLine = computed(() => {
    if (this.dirty()) return 'Unsaved changes';
    if (this.notice()) return this.notice();
    const updatedAt = this.form().updatedAt;
    return updatedAt ? `Saved ${formatWhen(updatedAt)}` : 'Not saved yet';
  });

  constructor() {
    effect(() => {
      const project = this.project();
      this.title.setTitle(`${project.name} · ${formatMonth(this.month())} · PRASA`);
    });
  }

  protected onProject(event: Event) {
    this.requestNav((event.target as HTMLSelectElement).value, this.month());
  }

  protected onMonth(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    this.requestNav(this.projectId(), next || this.month());
  }

  protected requestNav(nextProjectId: string, nextMonth: string) {
    if (nextProjectId === this.projectId() && nextMonth === this.month()) return;
    if (this.dirty()) {
      this.pending.set({ projectId: nextProjectId, month: nextMonth });
      queueMicrotask(() => this.resetPickers());
      return;
    }
    this.applyNav(nextProjectId, nextMonth);
  }

  protected keepEditing() {
    this.pending.set(null);
    queueMicrotask(() => this.resetPickers());
  }

  private resetPickers() {
    const project = this.projectSelect()?.nativeElement;
    if (project) project.value = this.projectId();
    const month = this.monthInput()?.nativeElement;
    if (month) month.value = this.month();
  }

  protected applyNav(nextProjectId: string, nextMonth: string, nextProjects = this.projects()) {
    const next = openReturn(nextProjectId, nextMonth, nextProjects);
    this.projectId.set(nextProjectId);
    this.month.set(nextMonth);
    this.form.set(next);
    this.snapshot.set(JSON.stringify(next));
    this.pending.set(null);
    this.notice.set('');
  }

  protected discardPending() {
    const pending = this.pending();
    if (!pending) return;
    this.applyNav(pending.projectId, pending.month);
  }

  protected saveAndContinue() {
    const nextProjects = this.persist('draft');
    const pending = this.pending();
    if (!pending || !nextProjects) return;
    this.applyNav(pending.projectId, pending.month, nextProjects);
  }

  protected persist(status: MonthlyReturn['status']) {
    const form = this.form();
    const saved: MonthlyReturn = {
      ...form,
      progressPercent: clamp(form.progressPercent, 0, 100),
      status,
      submittedBy: status === 'submitted' ? this.user().name : form.submittedBy,
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
          ? `Submitted. ${this.user().name} is recorded on this return.`
          : `Draft saved for ${this.project().name}, ${formatMonth(this.month())}.`,
      );
      return nextProjects;
    } catch {
      this.notice.set('Could not save on this device.');
      return null;
    }
  }

  protected setPhase(phaseId: string) {
    this.form.update((current) => ({ ...current, phases: cascadeStatus(current.phases, phaseId) }));
    this.notice.set('');
  }

  protected setStage(stageId: string) {
    this.form.update((current) => ({ ...current, stages: cascadeStatus(current.stages, stageId) }));
    this.notice.set('');
  }

  protected onPhaseSelect(event: Event) {
    this.setPhase((event.target as HTMLSelectElement).value);
  }

  protected onStageSelect(event: Event) {
    this.setStage((event.target as HTMLSelectElement).value);
  }

  protected patchPhase(id: string, patch: Partial<TrackRow>) {
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

  protected patchStage(id: string, patch: Partial<TrackRow>) {
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

  protected onPhaseChange(change: { id: string; patch: Partial<TrackRow> }) {
    this.patchPhase(change.id, change.patch);
  }

  protected onStageChange(change: { id: string; patch: Partial<TrackRow> }) {
    this.patchStage(change.id, change.patch);
  }

  protected setFinancial(key: keyof Financials, value: number) {
    this.form.update((current) => ({
      ...current,
      financials: { ...current.financials, [key]: value },
    }));
  }

  protected setProgress(value: number) {
    this.form.update((current) => ({ ...current, progressPercent: clamp(value, 0, 100) }));
    this.notice.set('');
  }

  protected setJob(key: keyof Jobs, value: number) {
    this.form.update((current) => ({
      ...current,
      jobs: { ...current.jobs, [key]: value },
    }));
  }

  protected patchMilestone(id: string, patch: Partial<Milestone>) {
    this.form.update((current) => ({
      ...current,
      milestones: current.milestones.map((milestone) =>
        milestone.id === id ? { ...milestone, ...patch } : milestone,
      ),
    }));
    this.notice.set('');
  }

  protected onMilestoneName(id: string, event: Event) {
    this.patchMilestone(id, { name: (event.target as HTMLInputElement).value });
  }

  protected onMilestoneDate(id: string, key: 'planned' | 'actual', event: Event) {
    this.patchMilestone(id, { [key]: (event.target as HTMLInputElement).value });
  }

  protected onMilestoneStatus(id: string, event: Event) {
    this.patchMilestone(id, {
      status: (event.target as HTMLSelectElement).value as Milestone['status'],
    });
  }

  protected removeMilestone(id: string) {
    this.form.update((current) => ({
      ...current,
      milestones: current.milestones.filter((item) => item.id !== id),
    }));
    this.notice.set('');
  }

  protected addMilestone() {
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
