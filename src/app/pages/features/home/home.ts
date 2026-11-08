import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './home.html'
})
export class HomeComponent {

  // قيم البحث الافتراضية كما ظهرت في تصميم Stitch.
  departureAirport = 'SAH';
  arrivalAirport = 'CAI';
  departureDate = '2025-06-15';

  constructor(
    private router: Router,
    readonly userService: UserService
  ) {}

  // تبديل مطار المغادرة والوصول إذا كان الخياران متاحين في القائمتين.
  swapAirports(): void {

    const currentDeparture = this.departureAirport;
    const currentArrival = this.arrivalAirport;

    const departureOptions = ['SAH', 'ADE', 'RIY', 'GXF'];
    const arrivalOptions = ['CAI', 'JED', 'AMM', 'DXB', 'ADE', 'SAH'];

    const canSwap =
      departureOptions.includes(currentArrival) &&
      arrivalOptions.includes(currentDeparture);

    if (canSwap) {
      this.departureAirport = currentArrival;
      this.arrivalAirport = currentDeparture;
      return;
    }

    // الانتقال للخيار التالي إذا تعذر التبديل المباشر.
    const currentIndex = arrivalOptions.indexOf(this.arrivalAirport);
    const nextIndex = (currentIndex + 1) % arrivalOptions.length;

    this.arrivalAirport = arrivalOptions[nextIndex];
  }

  // الانتقال إلى صفحة الرحلات مع تمرير بيانات البحث.
  onSearch(): void {

    if (
      !this.departureAirport ||
      !this.arrivalAirport ||
      !this.departureDate ||
      this.departureAirport === this.arrivalAirport
    ) {
      return;
    }

    this.router.navigate(['/flights'], {
      queryParams: {
        departure: this.departureAirport,
        arrival: this.arrivalAirport,
        date: this.departureDate
      }
    });
  }
}