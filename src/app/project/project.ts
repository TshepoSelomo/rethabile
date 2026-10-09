import { Component, inject } from '@angular/core';
import { CaptureState } from '../capture/capture-state';
import { NumberField } from '../number-field/number-field';

@Component({
  selector: 'app-project-master',
  standalone: true,
  imports: [NumberField],
  templateUrl: './project.html',
  styleUrl: './project.css',
})
export class ProjectMaster {
  protected readonly state = inject(CaptureState);
}
