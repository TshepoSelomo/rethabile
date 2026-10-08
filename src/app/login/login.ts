import { Component, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DEMO_ACCOUNTS } from '../data/model';
import { authenticate, resetPassword } from '../data/store';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly title = inject(Title);
  private readonly router = inject(Router);

  protected readonly accounts = DEMO_ACCOUNTS;
  protected readonly mode = signal<'sign-in' | 'reset'>('sign-in');
  protected readonly email = signal(DEMO_ACCOUNTS[0].email);
  protected readonly password = signal(DEMO_ACCOUNTS[0].password);
  protected readonly nextPassword = signal('');
  protected readonly confirm = signal('');
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly busy = signal(false);
  protected readonly showPassword = signal(false);

  constructor() {
    this.title.setTitle('PRASA — Monthly returns');
  }

  protected setEmail(event: Event) {
    this.email.set(inputValue(event));
  }

  protected setPassword(event: Event) {
    this.password.set(inputValue(event));
  }

  protected setNextPassword(event: Event) {
    this.nextPassword.set(inputValue(event));
  }

  protected setConfirm(event: Event) {
    this.confirm.set(inputValue(event));
  }

  protected togglePassword() {
    this.showPassword.update((open) => !open);
  }

  protected showReset() {
    this.mode.set('reset');
    this.error.set('');
    this.notice.set('');
  }

  protected showSignIn() {
    this.mode.set('sign-in');
    this.error.set('');
  }

  protected async onSignIn(event: Event) {
    event.preventDefault();
    this.error.set('');
    this.notice.set('');
    if (!this.email().trim() || !this.password()) {
      this.error.set('Enter the email and password.');
      return;
    }
    this.busy.set(true);
    try {
      const user = await authenticate(this.email(), this.password());
      if (!user) {
        this.error.set(
          'Email or password is not recognised. Only accounts already on the list can sign in.',
        );
        return;
      }
      void this.router.navigate(['/overview']);
    } finally {
      this.busy.set(false);
    }
  }

  protected async onReset(event: Event) {
    event.preventDefault();
    this.error.set('');
    this.notice.set('');
    if (this.nextPassword().length < 6) {
      this.error.set('Use at least 6 characters.');
      return;
    }
    if (this.nextPassword() !== this.confirm()) {
      this.error.set("Those passwords don't match.");
      return;
    }
    this.busy.set(true);
    try {
      const ok = await resetPassword(this.email(), this.nextPassword());
      if (!ok) {
        this.error.set('That email is not on the list. Accounts are added for this app in advance.');
        return;
      }
      this.password.set('');
      this.nextPassword.set('');
      this.confirm.set('');
      this.mode.set('sign-in');
      this.notice.set('Password updated on this device. Sign in with the new one.');
    } finally {
      this.busy.set(false);
    }
  }
}

function inputValue(event: Event) {
  return (event.target as HTMLInputElement).value;
}
