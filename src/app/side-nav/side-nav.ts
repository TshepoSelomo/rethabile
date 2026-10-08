import { Component, input, output } from '@angular/core';

export type CaptureSection =
  | 'overview'
  | 'financials'
  | 'jobs'
  | 'milestones'
  | 'procurement'
  | 'phases';

type NavItem = {
  id: CaptureSection;
  index: string;
  label: string;
};

@Component({
  selector: 'app-side-nav',
  standalone: true,
  templateUrl: './side-nav.html',
})
export class SideNav {
  readonly section = input.required<CaptureSection>();
  readonly userName = input.required<string>();
  readonly sectionChange = output<CaptureSection>();
  readonly signedOut = output<void>();

  protected readonly items: NavItem[] = [
    { id: 'overview', index: '01', label: 'Overview' },
    { id: 'financials', index: '02', label: 'Financials' },
    { id: 'jobs', index: '03', label: 'Jobs' },
    { id: 'milestones', index: '04', label: 'Milestones' },
    { id: 'procurement', index: '05', label: 'Procurement' },
    { id: 'phases', index: '06', label: 'PLP phases' },
  ];
}
