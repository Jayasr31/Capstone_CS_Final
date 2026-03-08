import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PartyhallService } from '../../services/partyhall.service';
import { BookingService } from '../../services/booking.service';
import { PartyHall } from '../../models/partyhall.model';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  halls: PartyHall[] = [];
  bookings: Booking[] = [];
  recentBookings: Booking[] = [];
  isLoading = true;
  username = '';

  stats = {
    totalHalls: 0,
    availableHalls: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0
  };

  constructor(
    public authService: AuthService,
    private hallService: PartyhallService,
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.hallService.getAllPartyHalls().subscribe({
      next: (halls: PartyHall[]) => {
        this.halls = halls;
        this.stats.totalHalls = halls.length;
        this.stats.availableHalls = halls.filter(h => h.hallAvailableStatus === 'Available').length;
      },
      error: () => {}
    });

    this.bookingService.getAllBookings().subscribe({
      next: (bookings: Booking[]) => {
        this.bookings = bookings;
        this.recentBookings = [...bookings].reverse().slice(0, 5);
        this.stats.totalBookings = bookings.length;
        this.stats.pendingBookings = bookings.filter(b => b.status === 'Pending').length;
        this.stats.confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
        this.stats.totalRevenue = bookings
          .filter(b => b.status !== 'Cancelled')
          .reduce((sum, b) => sum + b.totalPrice, 0);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'badge-success';
      case 'pending':   return 'badge-warning';
      case 'cancelled': return 'badge-danger';
      case 'completed': return 'badge-info';
      default: return 'badge-info';
    }
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
