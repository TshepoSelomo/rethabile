import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-number-field',
  standalone: true,
  templateUrl: './number-field.html',
  styleUrl: './number-field.css',
})
export class NumberField {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly max = input<number | null>(null);
  readonly valueChange = output<number>();

  protected onWheel(event: Event) {
    (event.currentTarget as HTMLInputElement).blur();
  }

  protected onInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    const next = raw === '' ? 0 : Number(raw);
    this.valueChange.emit(Number.isFinite(next) ? next : 0);
  }
}
