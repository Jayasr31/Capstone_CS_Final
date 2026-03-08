import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  showNavbar = false;
  private noNavbarRoutes = ['/login', '/register'];

  // Custom cursor
  cursorX = -200;
  cursorY = -200;
  sparkles: { x: number; y: number; id: number }[] = [];
  private sparkleId = 0;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showNavbar = !this.noNavbarRoutes.includes(event.urlAfterRedirects);
      }
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    this.cursorX = e.clientX;
    this.cursorY = e.clientY;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const id = this.sparkleId++;
    this.sparkles.push({ x: e.clientX, y: e.clientY, id });
    setTimeout(() => {
      this.sparkles = this.sparkles.filter(s => s.id !== id);
    }, 800);
  }
}
