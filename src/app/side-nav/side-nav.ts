import { Component, computed, inject, input } from '@angular/core';
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
  protected readonly initials = computed(() => {
    const parts = this.userName().trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  });

  protected readonly items: NavItem[] = [
    { path: '/overview', index: '01', label: 'Overview' },
    { path: '/financials', index: '02', label: 'Financials' },
    { path: '/jobs', index: '03', label: 'Jobs' },
    { path: '/milestones', index: '04', label: 'Milestones' },
    { path: '/procurement', index: '05', label: 'Procurement' },
    { path: '/phases', index: '06', label: 'PLP phases' },
  ];

  protected leave() {
    signOut();
    void this.router.navigate(['/login']);
  }
}
