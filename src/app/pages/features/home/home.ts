import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Airport, FlightService } from '../../../core/services/flight.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html'
})
export class HomeComponent implements OnInit {
  // قيم البحث الافتراضية
  departureAirport = 'SAH';
  arrivalAirport = 'CAI';
  departureDate = '';
  airports: Airport[] = [];

  constructor(
    private readonly router: Router,
    private readonly flightService: FlightService,
    readonly userService: UserService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.departureDate = today.toISOString().split('T')[0];

    this.flightService.getAllAirports().subscribe({
      next: airports => {
        this.airports = airports;
        if (airports.length >= 2) {
          if (!this.airports.some(a => a.code === this.departureAirport)) {
            this.departureAirport = airports[0].code;
          }
          if (!this.airports.some(a => a.code === this.arrivalAirport)) {
            this.arrivalAirport = airports[1].code;
          }
        }
      }
    });
  }

  // تبديل مطار المغادرة والوصول
  swapAirports(): void {
    const currentDeparture = this.departureAirport;
    this.departureAirport = this.arrivalAirport;
    this.arrivalAirport = currentDeparture;
  }

  // الانتقال إلى صفحة الرحلات مع تمرير بيانات البحث
  onSearch(): void {
    if (
      !this.departureAirport ||
      !this.arrivalAirport ||
      !this.departureDate ||
      this.departureAirport === this.arrivalAirport
    ) {
      return;
    }

    void this.router.navigate(['/flights'], {
      queryParams: {
        departure: this.departureAirport,
        arrival: this.arrivalAirport,
        date: this.departureDate
      }
    });
  }
}
