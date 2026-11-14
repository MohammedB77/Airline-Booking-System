import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Ticket, TicketService } from '../../../../core/services/ticket.service';

type TicketStatus = 'confirmed' | 'cancelled' | 'unknown';
type TicketFilter = 'all' | 'confirmed' | 'cancelled';

interface TicketCard extends Ticket {
  status: string;
  statusKey: TicketStatus;
}

@Component({
  selector: 'app-mytickets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mytickets.html'
})
export class MyticketsComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);

  readonly tickets = signal<TicketCard[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  selectedFilter: TicketFilter = 'all';
  selectedTicket: TicketCard | null = null;

  ngOnInit(): void {
    this.ticketService.getAll().subscribe({
      next: (tickets) => {
        const ticketCards = tickets.map((ticket): TicketCard => ({
          ...ticket,
          status: 'الحالة غير متوفرة',
          statusKey: 'unknown'
        }));

        this.tickets.set(ticketCards);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Ticket request failed:', error);
        this.errorMessage.set(
          'تعذّر تحميل التذاكر. تأكد من تشغيل الـ API ثم حدّث الصفحة.'
        );
        this.isLoading.set(false);
      }
    });
  }

  get confirmedCount(): number {
    return this.tickets().filter(ticket => ticket.statusKey === 'confirmed').length;
  }

  get cancelledCount(): number {
    return this.tickets().filter(ticket => ticket.statusKey === 'cancelled').length;
  }

  get filteredTickets(): TicketCard[] {
    if (this.selectedFilter === 'all') {
      return this.tickets();
    }

    return this.tickets().filter(ticket => ticket.statusKey === this.selectedFilter);
  }

  filterTickets(filter: TicketFilter): void {
    this.selectedFilter = filter;
  }

  openTicketModal(ticket: TicketCard): void {
    void this.router.navigate(['/ticket-details', ticket.id]);
  }

  closeTicketModal(): void {
    this.selectedTicket = null;
  }
}
