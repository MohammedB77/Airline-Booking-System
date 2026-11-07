import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

// استيراد نوع الرحلة والبيانات المشتركة.
import { Flight, flightsData } from '../flights-data';

@Component({
  selector: 'app-flightdetails',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './flightdetails.html'
})
export class FlightdetailsComponent implements OnInit {

  // الرحلة المعروضة في الصفحة.
  flight: Flight = flightsData[0];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    // متابعة رقم الرحلة الموجود في الرابط.
    this.route.paramMap.subscribe(params => {

      const flightNumber = params.get('flightNumber');

      // البحث عن الرحلة المطابقة لرقمها.
      const selectedFlight = flightsData.find(
        flight => flight.number === flightNumber
      );

      // عرض بيانات الرحلة التي تم العثور عليها.
      if (selectedFlight) {
        this.flight = selectedFlight;
      }
    });
  }

  // التحقق من إمكانية حجز الرحلة.
  get canBook(): boolean {
    return (
      this.flight.status !== 'ملغاة' &&
      (this.flight.businessSeats > 0 || this.flight.economySeats > 0)
    );
  }

  // الانتقال إلى صفحة الحجز وتمرير رقم الرحلة.
  bookFlight(): void {
    if (!this.canBook) {
      return;
    }

    this.router.navigate(['/booking'], {
      queryParams: {
        flightNumber: this.flight.number
      }
    });
  }
}