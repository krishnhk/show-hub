import { Pipe, PipeTransform } from '@angular/core';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Formats a number as Indian rupees, e.g. `₹1,250`. */
@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '₹0';
    }
    return inrFormatter.format(value);
  }
}
