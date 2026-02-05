import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-right-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './right-menu.component.html',
  styleUrls: ['./right-menu.component.scss']
})
export class RightMenuComponent {
  isMenuOpen = signal(false);
  currentPath = signal('');

  constructor(private router: Router) {
    this.currentPath.set(this.router.url);
  }

  toggleMenu() {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.closeMenu();
  }

  isCurrentPath(path: string): boolean {
    return this.currentPath() === path;
  }
}
