import { Component, inject } from '@angular/core';
import { CaptureState } from '../capture/capture-state';

@Component({
  selector: 'app-milestones',
  standalone: true,
  templateUrl: './milestones.html',
  styleUrl: './milestones.css',
})
export class Milestones {
  protected readonly state = inject(CaptureState);

  protected blur(event: Event) {
    (event.currentTarget as HTMLInputElement).blur();
  }
}
