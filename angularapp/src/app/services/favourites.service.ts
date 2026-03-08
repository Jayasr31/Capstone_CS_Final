import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FavouritesService {
  private readonly KEY = 'celebratespot_favourites';
  private ids: Set<number>;

  constructor() {
    const raw = localStorage.getItem(this.KEY);
    this.ids = raw ? new Set(JSON.parse(raw)) : new Set();
  }

  isFavourite(id: number): boolean {
    return this.ids.has(id);
  }

  toggle(id: number): boolean {
    if (this.ids.has(id)) {
      this.ids.delete(id);
    } else {
      this.ids.add(id);
    }
    this.save();
    return this.ids.has(id);
  }

  getAll(): number[] {
    return Array.from(this.ids);
  }

  private save(): void {
    localStorage.setItem(this.KEY, JSON.stringify(Array.from(this.ids)));
  }
}
