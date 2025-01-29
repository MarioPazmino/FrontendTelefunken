import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../services/auth.service';
import { CommonModule, NgForOf } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('openClose', [
      state('open', style({ height: '*', opacity: 1 })),
      state('closed', style({ height: '0px', opacity: 0 })),
      transition('open <=> closed', [animate('300ms ease-in-out')]),
    ]),
  ],
  imports: [NgForOf, CommonModule],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('sidebar') sidebar!: any;

  sidebarVisible = true;
  isMobile = false;
  private clickHandler: any;
  currentPlayer: any = {};
  games: any[] = [];
  playerHistory: any[] = [];

  constructor(private authService: AuthService, private router: Router) {
    this.clickHandler = this.handleClickOutside.bind(this);
  }

  ngOnInit() {
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
    document.addEventListener('click', this.clickHandler);

    this.checkAuthentication();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkScreenSize());
    document.removeEventListener('click', this.clickHandler);
  }

  checkAuthentication() {
    if (!this.authService.isUserLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.currentPlayer = this.authService.getUserData();
    }
  }

  goToGameInterface() {
    this.router.navigate(['/game-interface']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.sidebarVisible = !this.sidebarVisible;
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    this.sidebarVisible = !this.isMobile;
  }

  handleClickOutside(event: MouseEvent) {
    const sidebar = document.querySelector('.sidebar-wrapper');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const target = event.target as HTMLElement;

    if (
      this.isMobile &&
      this.sidebarVisible &&
      sidebar &&
      !sidebar.contains(target) &&
      toggleBtn &&
      !toggleBtn.contains(target)
    ) {
      this.sidebarVisible = false;
    }
  }
}
