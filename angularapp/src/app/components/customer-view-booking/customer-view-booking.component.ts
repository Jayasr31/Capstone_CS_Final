import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-customer-view-booking',
  templateUrl: './customer-view-booking.component.html',
  styleUrls: ['./customer-view-booking.component.css']
})
export class CustomerViewBookingComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  isLoading = true;
  successMsg = '';
  errorMsg = '';
  showDeleteConfirm = false;
  deleteTargetId: number | null = null;

  // Filters
  filterStatus = '';
  filterHall = '';
  sortBy = 'newest';

  // Detail modal
  selectedBooking: Booking | null = null;
  showDetailModal = false;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void { this.loadBookings(); }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getBookingsByUserId().subscribe({
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
    if (this.filterStatus) result = result.filter(b => b.status === this.filterStatus);
    if (this.filterHall) {
      result = result.filter(b =>
        (b.partyHall?.hallName || '').toLowerCase().includes(this.filterHall.toLowerCase())
      );
    }
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
    this.filterStatus = '';
    this.filterHall = '';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  openDetail(booking: Booking): void {
    this.selectedBooking = booking;
    this.showDetailModal = true;
  }

  closeDetail(): void {
    this.showDetailModal = false;
    this.selectedBooking = null;
  }

  confirmDelete(id: number): void {
    this.deleteTargetId = id;
    this.showDeleteConfirm = true;
  }

  doDelete(): void {
    if (!this.deleteTargetId) return;
    this.bookingService.deleteBooking(this.deleteTargetId).subscribe({
      next: () => {
        this.successMsg = 'Booking cancelled successfully.';
        this.showDeleteConfirm = false;
        this.bookings = this.bookings.filter(b => b.bookingId !== this.deleteTargetId);
        this.applyFilters();
        this.deleteTargetId = null;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed to cancel booking.'; }
    });
  }

  cancelDelete(): void { this.showDeleteConfirm = false; this.deleteTargetId = null; }

  getTotalSpent(): number {
    return this.bookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + b.totalPrice, 0);
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
