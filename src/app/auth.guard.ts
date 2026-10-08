import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { loadSession } from './data/store';

export const authGuard: CanActivateFn = () => {
  if (loadSession()) return true;
  return inject(Router).createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  if (!loadSession()) return true;
  return inject(Router).createUrlTree(['/overview']);
};
