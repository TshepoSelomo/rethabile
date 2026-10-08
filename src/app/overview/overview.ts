import { Component, inject } from '@angular/core';
import { CaptureState } from '../capture/capture-state';
import { NumberField } from '../number-field/number-field';
import { SummaryPanel } from '../summary-panel/summary-panel';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [NumberField, SummaryPanel],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview {
  protected readonly state = inject(CaptureState);
}
