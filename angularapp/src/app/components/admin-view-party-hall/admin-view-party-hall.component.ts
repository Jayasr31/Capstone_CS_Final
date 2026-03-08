import { Component, OnInit } from '@angular/core';
import { PartyhallService } from '../../services/partyhall.service';
import { PartyHall } from '../../models/partyhall.model';

@Component({
  selector: 'app-admin-view-party-hall',
  templateUrl: './admin-view-party-hall.component.html',
  styleUrls: ['./admin-view-party-hall.component.css']
})
export class AdminViewPartyHallComponent implements OnInit {
  halls: PartyHall[] = [];
  editData: Partial<PartyHall> = {};
  isLoading = true;
  successMsg = '';
  errorMsg = '';
  showDeleteConfirm = false;
  deleteTargetId: number | null = null;
  themes = ['Royal', 'Modern', 'Garden', 'Classic', 'Luxury', 'Rustic', 'Beach', 'Industrial', 'Contemporary', 'Rooftop Luxury', 'Heritage', 'Garden Party', 'Beachside'];

  // View mode: table or grid
  viewMode: 'table' | 'grid' = 'table';

  // Hall detail popup (shown on row/card click)
  selectedHall: PartyHall | null = null;

  // Edit form modal
  showEditModal = false;

  constructor(private hallService: PartyhallService) {}

  ngOnInit(): void { this.loadHalls(); }

  loadHalls(): void {
    this.isLoading = true;
    this.hallService.getAllPartyHalls().subscribe({
      next: (halls) => { this.halls = halls; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  openHallDetail(hall: PartyHall): void {
    this.selectedHall = hall;
  }

  closeHallDetail(): void {
    this.selectedHall = null;
  }

  openEdit(): void {
    if (!this.selectedHall) return;
    this.editData = { ...this.selectedHall };
    this.selectedHall = null;
    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.editData = {};
    this.errorMsg = '';
  }

  saveEdit(): void {
    this.hallService.updatePartyHall(this.editData as PartyHall).subscribe({
      next: () => {
        this.successMsg = 'Party hall updated successfully!';
        this.showEditModal = false;
        this.editData = {};
        this.loadHalls();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Update failed.'; }
    });
  }

  confirmDelete(id: number): void {
    this.selectedHall = null;
    this.deleteTargetId = id;
    this.showDeleteConfirm = true;
  }

  doDelete(): void {
    if (!this.deleteTargetId) return;
    this.hallService.deletePartyHall(this.deleteTargetId).subscribe({
      next: () => {
        this.successMsg = 'Party hall deleted successfully!';
        this.showDeleteConfirm = false;
        this.deleteTargetId = null;
        this.loadHalls();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Delete failed.'; }
    });
  }

  cancelDelete(): void { this.showDeleteConfirm = false; this.deleteTargetId = null; }
}
