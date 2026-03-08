import { Component } from '@angular/core';
import { PartyhallService } from '../../services/partyhall.service';
import { PartyHall } from '../../models/partyhall.model';

@Component({
  selector: 'app-admin-add-party-hall',
  templateUrl: './admin-add-party-hall.component.html',
  styleUrls: ['./admin-add-party-hall.component.css']
})
export class AdminAddPartyHallComponent {
  hall: PartyHall = {
    hallName: '',
    hallImageUrl: '',
    hallLocation: '',
    hallAvailableStatus: 'Available',
    price: 0,
    capacity: 0,
    description: '',
    theme: '',
    additionalImages: ''
  };

  additionalImagesInput = '';
  additionalImagePreviews: string[] = [];
  successMsg = '';
  errorMsg = '';
  isLoading = false;
  imagePreview = '';

  themes = ['Royal', 'Modern', 'Garden', 'Classic', 'Luxury', 'Rustic', 'Beach', 'Industrial'];

  constructor(private hallService: PartyhallService) {}

  onMainImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.errorMsg = 'Please select a valid image file.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMsg = 'Image size must be less than 5MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.hall.hallImageUrl = result;
      this.imagePreview = result;
      this.errorMsg = '';
    };
    reader.readAsDataURL(file);
  }

  onAdditionalImagesSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    this.additionalImagePreviews = [];
    const readers: Promise<string>[] = Array.from(files).slice(0, 5).map(file =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      })
    );
    Promise.all(readers).then(results => {
      this.additionalImagePreviews = results;
      this.hall.additionalImages = JSON.stringify(results);
    });
  }

  removeMainImage(): void {
    this.hall.hallImageUrl = '';
    this.imagePreview = '';
  }

  removeAdditionalImage(index: number): void {
    this.additionalImagePreviews.splice(index, 1);
    this.hall.additionalImages = JSON.stringify(this.additionalImagePreviews);
  }

  onSubmit(): void {
    if (!this.hall.hallName || !this.hall.hallLocation || !this.hall.price || !this.hall.capacity) {
      this.errorMsg = 'Please fill all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMsg = '';

    this.hallService.addPartyHall(this.hall).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg = `"${this.hall.hallName}" has been added successfully!`;
        this.resetForm();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Failed to add party hall.';
      }
    });
  }

  resetForm(): void {
    this.hall = {
      hallName: '', hallImageUrl: '', hallLocation: '',
      hallAvailableStatus: 'Available', price: 0, capacity: 0,
      description: '', theme: '', additionalImages: ''
    };
    this.additionalImagesInput = '';
    this.imagePreview = '';
    this.additionalImagePreviews = [];
  }
}

