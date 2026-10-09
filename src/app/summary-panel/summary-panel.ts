import { Component, computed, input } from '@angular/core';
import { formatMoney, formatPercent, formatWhen, jobsShortfall, type MonthlyReturn, type Project } from '../data/model';

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

  protected readonly formatPercent = formatPercent;
  protected readonly formatMoney = formatMoney;
  protected readonly formatWhen = formatWhen;
  protected readonly shortfall = computed(() => jobsShortfall(this.form().jobs));
}
