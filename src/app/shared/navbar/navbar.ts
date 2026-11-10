import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html'
})
export class NavbarComponent {

  userService = inject(UserService);
  private router = inject(Router);

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}