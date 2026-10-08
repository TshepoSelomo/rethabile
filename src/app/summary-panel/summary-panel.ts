import { Component, computed, input } from '@angular/core';
import {
  formatMoney,
  formatMonth,
  formatPercent,
  formatWhen,
  progressStory,
  type MonthlyReturn,
  type ProgressResult,
  type Project,
  type TrackRow,
} from '../data/model';

@Component({
  selector: 'app-summary-panel',
  standalone: true,
  templateUrl: './summary-panel.html',
  styleUrl: './summary-panel.css',
})
export class SummaryPanel {
  readonly project = input.required<Project>();
  readonly month = input.required<string>();
  readonly form = input.required<MonthlyReturn>();
  readonly progress = input.required<ProgressResult>();
  readonly balance = input.required<number>();

  protected readonly formatMonth = formatMonth;
  protected readonly formatPercent = formatPercent;
  protected readonly formatMoney = formatMoney;
  protected readonly formatWhen = formatWhen;
  protected readonly progressStory = progressStory;

  protected readonly currentPhase = computed(
    () => this.form().phases.find((phase) => phase.status === 'In Progress') ?? null,
  );
  protected readonly currentStage = computed(
    () => this.form().stages.find((stage) => stage.status === 'In Progress') ?? null,
  );

  protected phaseFill(phase: TrackRow) {
    if (phase.status === 'Complete') return 100;
    if (phase.status === 'In Progress') return this.progress().percentOfPhase;
    return 0;
  }
}
