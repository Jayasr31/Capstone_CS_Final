import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  user: User = {
    email: '',
    password: '',
    username: '',
    mobileNumber: '',
    userRole: 'Customer'
  };
  confirmPassword = '';
  adminKey = '';
  errorMsg = '';
  successMsg = '';
  isLoading = false;
  showPassword = false;

  get passwordStrength(): 'weak' | 'strong' | 'very-strong' {
    const p = this.user.password;
    if (!p || p.trim().length < 6 || /\s/.test(p)) return 'weak';
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSpecial = /[^A-Za-z0-9]/.test(p);
    if (p.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial) return 'very-strong';
    if (p.length >= 6 && ((hasUpper || hasLower) && hasNumber)) return 'strong';
    return 'weak';
  }

  constructor(private authService: AuthService, private router: Router, public theme: ThemeService) {}

  onRegister(): void {
    // Trim all fields before validation
    this.user.username = this.user.username.trim();
    this.user.email = this.user.email.trim();
    this.user.mobileNumber = this.user.mobileNumber.trim();

    if (!this.user.email || !this.user.password || !this.user.username || !this.user.mobileNumber) {
      this.errorMsg = 'All fields are required.';
      return;
    }
    if (/\s/.test(this.user.password)) {
      this.errorMsg = 'Password must not contain spaces.';
      return;
    }
    if (this.user.password !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }
    if (this.user.password.length < 6) {
      this.errorMsg = 'Password must be at least 6 characters.';
      return;
    }
    if (!/^\d{10}$/.test(this.user.mobileNumber)) {
      this.errorMsg = 'Mobile number must be 10 digits.';
      return;
    }
    if (this.user.userRole === 'Admin' && !this.adminKey.trim()) {
      this.errorMsg = 'Admin secret key is required.';
      return;
    }
    this.adminKey = this.adminKey.trim();

    this.isLoading = true;
    this.errorMsg = '';

    const keyToUse = this.user.userRole === 'Admin' ? this.adminKey : undefined;

    this.authService.register(this.user, keyToUse).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMsg = 'Registration successful! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
