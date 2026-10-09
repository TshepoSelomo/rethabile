import { Component, input, output } from '@angular/core';

type TrackStatus = 'Not Started' | 'In Progress' | 'Complete';

type TrackRow = {
  id: string;
  name: string;
  weight: number;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  status: TrackStatus;
};

const TRACK_STATUSES: TrackStatus[] = ['Not Started', 'In Progress', 'Complete'];

function statusSlug(status: string) {
  return status.toLowerCase().replace(/\s+/g, '-');
}

@Component({
  selector: 'app-track-section',
  standalone: true,
  templateUrl: './track-section.html',
  styleUrl: './track-section.css',
})
export class TrackSection {
  readonly number = input.required<string>();
  readonly title = input.required<string>();
  readonly headingId = input.required<string>();
  readonly rows = input.required<TrackRow[]>();
  readonly nameLabel = input.required<string>();
  readonly showWeight = input(false);
  readonly showHeading = input(true);
  readonly hint = input('');
  readonly changed = output<{ id: string; patch: Partial<TrackRow> }>();

  protected readonly statuses = TRACK_STATUSES;
  protected readonly statusSlug = statusSlug;

  protected patch(id: string, patch: Partial<TrackRow>) {
    this.changed.emit({ id, patch });
  }

  protected onDate(id: string, key: keyof TrackRow, event: Event) {
    this.patch(id, { [key]: (event.target as HTMLInputElement).value });
  }

  protected onStatus(id: string, event: Event) {
    this.patch(id, { status: (event.target as HTMLSelectElement).value as TrackStatus });
  }
}
