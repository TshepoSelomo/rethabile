import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { CaptureState } from './capture-state';
import { SideNav } from '../side-nav/side-nav';

@Component({
  selector: 'app-capture',
  standalone: true,
  imports: [SideNav, RouterOutlet],
  templateUrl: './capture.html',
  styleUrl: './capture.css',
})
export class Capture {
  protected readonly state = inject(CaptureState);
  private readonly title = inject(Title);
  private readonly monthInput = viewChild<ElementRef<HTMLInputElement>>('monthInput');

  constructor() {
    effect(() => {
      const project = this.state.project();
      this.title.setTitle(`${project.name} · ${this.state.formatMonth(this.state.month())} · PRASA`);
    });
  }

  protected chooseProject(projectId: string) {
    this.state.requestNav(projectId, this.state.month());
  }

  protected onProjectSearchKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.state.clearProjectQuery();
      return;
    }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const first = this.state.searchResults()[0];
    if (first) this.chooseProject(first.id);
  }

  protected onMonth(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    this.state.requestNav(this.state.projectId(), next || this.state.month());
    if (this.state.pending()) queueMicrotask(() => this.resetPickers());
  }

  protected keepEditing() {
    this.state.keepEditing();
    queueMicrotask(() => this.resetPickers());
  }

  private resetPickers() {
    const month = this.monthInput()?.nativeElement;
    if (month) month.value = this.state.month();
  }
}
