
import {inject,ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// Shared flight type and mock data.
import { Flight, flightsData } from '../flights-data';

import { FlightService } from '../../../../core/services/flight.service';

@Component({
  selector: 'app-available-flights',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './availableflights.html'
})
export class AvailableFlightsComponent implements OnInit {

  // Default search values.
  departureAirport = '';
  arrivalAirport = '';
  departureDate = '2026-11-07';

  // Selected status filter.
  selectedStatus = 'all';

  // Flight statuses used by the filter buttons.
  statuses = [
    {
      label: 'الكل',
      value: 'all',
      dotClass: ''
    },
    {
      label: 'مؤكدة',
      value: 'مؤكدة',
      dotClass: 'bg-emerald-600'
    },
    {
      label: 'مجدولة',
      value: 'مجدولة',
      dotClass: 'bg-primary-container'
    },
    {
      label: 'متأخرة',
      value: 'متأخرة',
      dotClass: 'bg-amber-500'
    },
    {
      label: 'ملغاة',
      value: 'ملغاة',
      dotClass: 'bg-error'
    }
  ];
  private readonly cdr = inject(ChangeDetectorRef);
  // Flights initially loaded from shared mock data.
  flights: Flight[] = [];

  // Flights displayed to the user.
  filteredFlights: Flight[] = [];

  // API loading state.
  isLoading = true;

  // API error message.
  loadError = '';

  constructor(
    private router: Router,
    private flightService: FlightService
  ) { }

  // Load actual flights from the database.
  ngOnInit(): void {
    this.isLoading = true;
    this.loadError = '';

    this.flightService.getApiFlights().subscribe({
      next: flights => {
        this.flights = flights;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error('Error loading flights:', error);

        // Keep the existing mock data if the API fails.
        this.flights = flightsData;
        this.applyFilters();

        this.loadError = 'تعذر تحميل الرحلات من الخادم. يتم عرض البيانات التجريبية.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Swap departure and arrival airports.
  swapAirports(): void {
    const currentDeparture = this.departureAirport;

    this.departureAirport = this.arrivalAirport;
    this.arrivalAirport = currentDeparture;

    this.applyFilters();
  }

  // Filter flights by airports and status.
  applyFilters(): void {
    this.filteredFlights = this.flights.filter(flight => {

      // Check departure airport.
      const originMatch =
        !this.departureAirport ||
        flight.origin === this.departureAirport;

      // Check arrival airport.
      const destinationMatch =
        !this.arrivalAirport ||
        flight.destination === this.arrivalAirport;

      // Check flight status.
      const statusMatch =
        this.selectedStatus === 'all' ||
        flight.status === this.selectedStatus;

      return originMatch && destinationMatch && statusMatch;
    });
  }

  // Filter flights by selected status.
  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  // Reset search and filters.
  resetFilters(): void {
    this.departureAirport = '';
    this.arrivalAirport = '';
    this.selectedStatus = 'all';
    this.departureDate = '2026-11-07';

    this.applyFilters();
  }

  // Navigate to the flight booking page.
  bookFlight(flight: Flight): void {

    // Prevent booking cancelled flights.
    if (flight.status === 'ملغاة') {
      return;
    }

    // Ensure the flight has a database ID.
    if (flight.id == null) {
      console.error('Flight ID is missing:', flight);
      return;
    }

    this.router.navigate(['/booking'], {
      queryParams: {
        flightId: flight.id,
        date: this.departureDate
      }
    });
  }
}
