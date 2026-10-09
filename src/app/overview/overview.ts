import { Component, inject } from '@angular/core';
import { CaptureState } from '../capture/capture-state';
import { SummaryPanel } from '../summary-panel/summary-panel';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [SummaryPanel],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview {
  protected readonly state = inject(CaptureState);
}
