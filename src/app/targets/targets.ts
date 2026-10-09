import { Component, inject } from '@angular/core';
import { CaptureState } from '../capture/capture-state';
import { NumberField } from '../number-field/number-field';

@Component({
  selector: 'app-targets',
  standalone: true,
  imports: [NumberField],
  templateUrl: './targets.html',
  styleUrl: './targets.css',
})
export class Targets {
  protected readonly state = inject(CaptureState);
}
