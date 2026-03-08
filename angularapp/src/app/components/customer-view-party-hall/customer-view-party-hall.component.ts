import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PartyhallService } from '../../services/partyhall.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { FavouritesService } from '../../services/favourites.service';
import { PartyHall } from '../../models/partyhall.model';
import { Booking } from '../../models/booking.model';
import { Review } from '../../models/review.model';

@Component({
  selector: 'app-customer-view-party-hall',
  templateUrl: './customer-view-party-hall.component.html',
  styleUrls: ['./customer-view-party-hall.component.css']
})
export class CustomerViewPartyHallComponent implements OnInit {
  halls: PartyHall[] = [];
  filteredHalls: PartyHall[] = [];
  selectedHall: PartyHall | null = null;
  showBookingModal = false;
  successMsg = '';
  errorMsg = '';
  isLoading = true;
  currentImageIndex = 0;

  // Filters
  searchQuery = '';
  maxPrice = 200000;
  minCapacity = 0;
  filterLocation = '';
  filterTheme = '';
  filterStatus = '';
  showFavouritesOnly = false;

  // Today's date for min date validation
  today = new Date().toISOString().split('T')[0];

  // Hall Reviews
  hallReviews: Review[] = [];
  hallReviewsLoading = false;

  // Coupon system
  coupons: { [key: string]: { discount: number; label: string } } = {
    'CELEBRATE10': { discount: 10, label: '10% Off — Welcome Offer' },
    'FIRSTBOOK20': { discount: 20, label: '20% Off — First Booking' },
    'PARTY15':     { discount: 15, label: '15% Party Special' },
    'MONSOON30':   { discount: 30, label: '30% Monsoon Sale' },
    'GOLD50':      { discount: 50, label: '50% Gold Member Offer' },
  };
  couponCode = '';
  appliedCoupon: { discount: number; label: string } | null = null;
  couponError = '';
  couponSuccess = '';

  get discountAmount(): number {
    if (!this.appliedCoupon) return 0;
    return Math.round(this.booking.totalPrice * this.appliedCoupon.discount / 100);
  }
  get finalPrice(): number {
    return this.booking.totalPrice - this.discountAmount;
  }

  applyCoupon(): void {
    const code = this.couponCode.trim().toUpperCase();
    if (this.coupons[code]) {
      this.appliedCoupon = this.coupons[code];
      this.couponSuccess = `Coupon applied! ${this.appliedCoupon.label}`;
      this.couponError = '';
    } else {
      this.couponError = 'Invalid coupon code. Try CELEBRATE10, PARTY15 or FIRSTBOOK20.';
      this.couponSuccess = '';
      this.appliedCoupon = null;
    }
  }
  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponCode = '';
    this.couponError = '';
    this.couponSuccess = '';
  }

  get hallAvgRating(): number {
    if (!this.hallReviews.length) return 0;
    return Math.round((this.hallReviews.reduce((s, r) => s + r.rating, 0) / this.hallReviews.length) * 10) / 10;
  }

  getStarArray(rating: number): boolean[] {
    return [1,2,3,4,5].map(i => i <= Math.round(rating));
  }

  // Booking form
  booking: Booking = {
    noOfPersons: 1,
    fromDate: '',
    toDate: '',
    status: 'Pending',
    totalPrice: 0,
    address: '',
    userId: 0,
    partyHallId: 0
  };

  constructor(
    private hallService: PartyhallService,
    private bookingService: BookingService,
    private authService: AuthService,
    private route: ActivatedRoute,
    public favouritesService: FavouritesService
  ) {}

  ngOnInit(): void {
    this.loadHalls();
    this.route.queryParams.subscribe(p => {
      if (p['showFav'] === '1') { this.showFavouritesOnly = true; this.applyFilters(); }
    });
  }

  getMapUrl(hall: PartyHall): string {
    // Prefer the precise full address if set, otherwise fall back to name + location
    const q = encodeURIComponent(
      hall.fullAddress && hall.fullAddress.trim()
        ? hall.fullAddress
        : hall.hallName + ', ' + hall.hallLocation + ', Mumbai, India'
    );
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  getMapEmbedUrl(hall: PartyHall): string {
    const q = encodeURIComponent(
      hall.fullAddress && hall.fullAddress.trim()
        ? hall.fullAddress
        : hall.hallName + ', ' + hall.hallLocation + ', Mumbai, India'
    );
    return `https://maps.google.com/maps?q=${q}&output=embed`;
  }

  loadHalls(): void {
    this.isLoading = true;
    this.hallService.getAllPartyHalls().subscribe({
      next: (halls) => {
        this.halls = halls;
        this.filteredHalls = halls;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilters(): void {
    this.filteredHalls = this.halls.filter(h => {
      const matchSearch = !this.searchQuery ||
        h.hallName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        h.hallLocation.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchPrice = h.price <= this.maxPrice;
      const matchCapacity = h.capacity >= this.minCapacity;
      const matchLocation = !this.filterLocation ||
        h.hallLocation.toLowerCase().includes(this.filterLocation.toLowerCase());
      const matchTheme = !this.filterTheme || (h.theme || '').toLowerCase().includes(this.filterTheme.toLowerCase());
      const matchStatus = !this.filterStatus || h.hallAvailableStatus === this.filterStatus;
      const matchFav = !this.showFavouritesOnly || this.favouritesService.isFavourite(h.partyHallId ?? 0);
      return matchSearch && matchPrice && matchCapacity && matchLocation && matchTheme && matchStatus && matchFav;
    });
  }

  openBookingModal(hall: PartyHall): void {
    this.selectedHall = hall;
    this.booking = {
      noOfPersons: 1,
      fromDate: '',
      toDate: '',
      status: 'Pending',
      totalPrice: 0,
      address: '',
      userId: this.authService.getUserId(),
      partyHallId: hall.partyHallId
    };
    this.showBookingModal = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.currentImageIndex = 0;
    this.hallReviews = [];
    this.couponCode = '';
    this.appliedCoupon = null;
    this.couponError = '';
    this.couponSuccess = '';
    if (hall.partyHallId) {
      this.hallReviewsLoading = true;
      this.hallService.getReviewsByHallId(hall.partyHallId).subscribe({
        next: (reviews) => { this.hallReviews = reviews; this.hallReviewsLoading = false; },
        error: () => { this.hallReviewsLoading = false; }
      });
    }
  }

  closeModal(): void {
    this.showBookingModal = false;
    this.selectedHall = null;
  }

  calculatePrice(): void {
    if (this.booking.fromDate && this.booking.toDate && this.selectedHall) {
      const from = new Date(this.booking.fromDate);
      const to = new Date(this.booking.toDate);
      const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
      this.booking.totalPrice = days * this.selectedHall.price;
    }
  }

  submitBooking(): void {
    if (!this.booking.fromDate || !this.booking.toDate || !this.booking.address) {
      this.errorMsg = 'Please fill all required fields.';
      return;
    }
    // Validate: from date must not be in the past
    const fromDate = new Date(this.booking.fromDate);
    const todayDate = new Date(this.today);
    if (fromDate < todayDate) {
      this.errorMsg = 'Booking date cannot be in the past.';
      return;
    }
    // Validate: to date must be >= from date
    const toDate = new Date(this.booking.toDate);
    if (toDate < fromDate) {
      this.errorMsg = 'End date must be on or after start date.';
      return;
    }
    // Validate capacity
    if (this.selectedHall && this.booking.noOfPersons > this.selectedHall.capacity) {
      this.errorMsg = `Maximum capacity is ${this.selectedHall.capacity} persons.`;
      return;
    }
    if (this.booking.noOfPersons < 1) {
      this.errorMsg = 'Number of persons must be at least 1.';
      return;
    }
    this.errorMsg = '';
    const bookingToSubmit = { ...this.booking, totalPrice: this.finalPrice };
    this.bookingService.addBooking(bookingToSubmit).subscribe({
      next: () => {
        this.successMsg = 'Booking confirmed! We will contact you shortly.';
        setTimeout(() => this.closeModal(), 2000);
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Booking failed. Please try again.';
      }
    });
  }

  getAdditionalImages(hall: PartyHall): string[] {
    try {
      return hall.additionalImages ? JSON.parse(hall.additionalImages) : [];
    } catch { return []; }
  }

  nextImage(images: string[]): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
  }

  prevImage(images: string[]): void {
    const total = images.length;
    this.currentImageIndex = (this.currentImageIndex - 1 + total) % total;
  }
}
