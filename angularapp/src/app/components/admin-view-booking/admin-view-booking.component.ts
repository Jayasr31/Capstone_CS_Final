import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-admin-view-booking',
  templateUrl: './admin-view-booking.component.html',
  styleUrls: ['./admin-view-booking.component.css']
})
export class AdminViewBookingComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  isLoading = true;
  successMsg = '';
  errorMsg = '';
  statusOptions = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

  // Filters
  searchQuery = '';
  filterStatus = '';
  filterHall = '';
  filterFromDate = '';
  filterToDate = '';
  sortBy = 'newest';

  // Detail Modal
  selectedBooking: Booking | null = null;
  showDetailModal = false;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void { this.loadBookings(); }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getAllBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilters(): void {
    let result = [...this.bookings];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(b =>
        (b.user?.username || '').toLowerCase().includes(q) ||
        (b.user?.email || '').toLowerCase().includes(q) ||
        (b.partyHall?.hallName || '').toLowerCase().includes(q)
      );
    }
    if (this.filterStatus) {
      result = result.filter(b => b.status === this.filterStatus);
    }
    if (this.filterHall) {
      result = result.filter(b =>
        (b.partyHall?.hallName || '').toLowerCase().includes(this.filterHall.toLowerCase())
      );
    }
    if (this.filterFromDate) {
      result = result.filter(b => new Date(b.fromDate) >= new Date(this.filterFromDate));
    }
    if (this.filterToDate) {
      result = result.filter(b => new Date(b.toDate) <= new Date(this.filterToDate));
    }

    // Sort
    if (this.sortBy === 'newest') {
      result.sort((a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime());
    } else if (this.sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime());
    } else if (this.sortBy === 'price-high') {
      result.sort((a, b) => b.totalPrice - a.totalPrice);
    } else if (this.sortBy === 'price-low') {
      result.sort((a, b) => a.totalPrice - b.totalPrice);
    }

    this.filteredBookings = result;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterHall = '';
    this.filterFromDate = '';
    this.filterToDate = '';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  updateStatus(booking: Booking, newStatus: string): void {
    const updated = { ...booking, status: newStatus };
    this.bookingService.updateBooking(updated).subscribe({
      next: () => {
        booking.status = newStatus;
        this.successMsg = 'Booking status updated!';
        this.applyFilters();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Update failed.'; }
    });
  }

  openDetail(booking: Booking): void {
    this.selectedBooking = booking;
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.selectedBooking = null;
  }

  getTotalRevenue(): number {
    return this.filteredBookings
      .filter(b => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0);
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
}

