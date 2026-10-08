import { Component, signal } from '@angular/core';
import { Capture } from './capture/capture';
import { loadSession, signOut, type SessionUser } from './data/store';
import { Login } from './login/login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Login, Capture],
  templateUrl: './app.html',
})
export class App {
  protected readonly user = signal<SessionUser | null>(loadSession());

  protected signedIn(user: SessionUser) {
    this.user.set(user);
  }

  protected signedOut() {
    signOut();
    this.user.set(null);
  }
}
