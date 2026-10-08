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
  private readonly projectSelect = viewChild<ElementRef<HTMLSelectElement>>('projectSelect');
  private readonly monthInput = viewChild<ElementRef<HTMLInputElement>>('monthInput');

  constructor() {
    effect(() => {
      const project = this.state.project();
      this.title.setTitle(`${project.name} · ${this.state.formatMonth(this.state.month())} · PRASA`);
    });
  }

  protected onProject(event: Event) {
    const next = (event.target as HTMLSelectElement).value;
    this.state.requestNav(next, this.state.month());
    if (this.state.pending()) queueMicrotask(() => this.resetPickers());
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
    const project = this.projectSelect()?.nativeElement;
    if (project) project.value = this.state.projectId();
    const month = this.monthInput()?.nativeElement;
    if (month) month.value = this.state.month();
  }
}
