import { Component, inject } from '@angular/core';
import { CaptureState } from '../capture/capture-state';
import { NumberField } from '../number-field/number-field';

@Component({
  selector: 'app-financials',
  standalone: true,
  imports: [NumberField],
  templateUrl: './financials.html',
  styleUrl: './financials.css',
})
export class Financials {
  protected readonly state = inject(CaptureState);
}
