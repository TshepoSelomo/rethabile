import { Component, inject } from '@angular/core';
import { CaptureState } from '../capture/capture-state';
import { TrackSection } from '../track-section/track-section';

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [TrackSection],
  templateUrl: './procurement.html',
  styleUrl: './procurement.css',
})
export class Procurement {
  protected readonly state = inject(CaptureState);
}
