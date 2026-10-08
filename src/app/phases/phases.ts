import { Component, inject } from '@angular/core';
import { CaptureState } from '../capture/capture-state';
import { TrackSection } from '../track-section/track-section';

@Component({
  selector: 'app-phases',
  standalone: true,
  imports: [TrackSection],
  templateUrl: './phases.html',
  styleUrl: './phases.css',
})
export class Phases {
  protected readonly state = inject(CaptureState);
}
