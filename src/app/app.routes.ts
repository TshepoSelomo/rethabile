import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { Capture } from './capture/capture';
import { CaptureState } from './capture/capture-state';
import { Financials } from './financials/financials';
import { Jobs } from './jobs/jobs';
import { Login } from './login/login';
import { Milestones } from './milestones/milestones';
import { Overview } from './overview/overview';
import { Phases } from './phases/phases';
import { Procurement } from './procurement/procurement';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard] },
  {
    path: '',
    component: Capture,
    canActivate: [authGuard],
    providers: [CaptureState],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', component: Overview },
      { path: 'financials', component: Financials },
      { path: 'jobs', component: Jobs },
      { path: 'milestones', component: Milestones },
      { path: 'procurement', component: Procurement },
      { path: 'phases', component: Phases },
    ],
  },
  { path: '**', redirectTo: '' },
];
