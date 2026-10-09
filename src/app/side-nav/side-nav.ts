import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { signOut } from '../data/store';

type NavItem = {
  path: string;
  index: string;
  label: string;
};

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css',
})
export class SideNav {
  private readonly router = inject(Router);
  readonly userName = input.required<string>();
  protected readonly open = signal(false);
  protected readonly initials = computed(() => {
    const parts = this.userName().trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  protected readonly items: NavItem[] = [
    { path: '/overview', index: '01', label: 'Overview' },
    { path: '/project', index: '02', label: 'Project master' },
    { path: '/financials', index: '03', label: 'Financial monthly' },
    { path: '/targets', index: '04', label: 'Targets & actuals' },
    { path: '/jobs', index: '05', label: 'Jobs monthly' },
    { path: '/milestones', index: '06', label: 'Milestones' },
    { path: '/procurement', index: '07', label: 'Procurement' },
  ];

  protected toggle() {
    this.open.update((value) => !value);
  }

  protected close() {
    this.open.set(false);
  }

  protected leave() {
    signOut();
    void this.router.navigate(['/login']);
  }
}
