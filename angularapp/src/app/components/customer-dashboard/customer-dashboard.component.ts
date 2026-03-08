import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PartyhallService } from '../../services/partyhall.service';
import { BookingService } from '../../services/booking.service';
import { PartyHall } from '../../models/partyhall.model';
import { Booking } from '../../models/booking.model';
import { Review } from '../../models/review.model';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
  halls: PartyHall[] = [];
  bookings: Booking[] = [];
  reviews: Review[] = [];
  featuredHalls: PartyHall[] = [];
  isLoading = true;
  username = '';

  stats = {
    totalHalls: 0,
    myBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    myReviews: 0,
    totalSpent: 0
  };

  greeting = '';

  constructor(
    public authService: AuthService,
    private hallService: PartyhallService,
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.setGreeting();
    this.loadData();
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good Morning';
    else if (hour < 17) this.greeting = 'Good Afternoon';
    else this.greeting = 'Good Evening';
  }

  loadData(): void {
    this.isLoading = true;

    this.hallService.getAllPartyHalls().subscribe({
      next: (halls: PartyHall[]) => {
        this.halls = halls;
        this.featuredHalls = halls.filter(h => h.hallAvailableStatus === 'Available').slice(0, 3);
        this.stats.totalHalls = halls.filter(h => h.hallAvailableStatus === 'Available').length;
      },
      error: () => {}
    });

    this.bookingService.getBookingsByUserId().subscribe({
      next: (bookings: Booking[]) => {
        this.bookings = bookings;
        this.stats.myBookings = bookings.length;
        this.stats.pendingBookings = bookings.filter(b => b.status === 'Pending').length;
        this.stats.confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
        this.stats.totalSpent = bookings
          .filter(b => b.status !== 'Cancelled')
          .reduce((sum, b) => sum + b.totalPrice, 0);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });

    this.hallService.getReviewsByUserId().subscribe({
      next: (reviews: Review[]) => {
        this.reviews = reviews;
        this.stats.myReviews = reviews.length;
      },
      error: () => {}
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

  getRecentBookings(): Booking[] {
    return [...this.bookings].reverse().slice(0, 3);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
