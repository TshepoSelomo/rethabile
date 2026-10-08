import { Component, inject } from '@angular/core';
import { CaptureState } from '../capture/capture-state';
import { NumberField } from '../number-field/number-field';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [NumberField],
  templateUrl: './jobs.html',
  styleUrl: './jobs.css',
})
export class Jobs {
  protected readonly state = inject(CaptureState);
}
