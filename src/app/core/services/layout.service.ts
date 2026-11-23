import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type NavPosition = 'top' | 'left';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly POS_KEY = 'sygacut_nav_position';
  private readonly COLLAPSED_KEY = 'sygacut_sidebar_collapsed';
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Par défaut : navigation en haut ('top')
  navPosition = signal<NavPosition>('top');
  sidebarCollapsed = signal<boolean>(false);
  mobileSidebarOpen = signal<boolean>(false);

  constructor() {
    if (this.isBrowser) {
      const savedPos = localStorage.getItem(this.POS_KEY);
      if (savedPos === 'left' || savedPos === 'top') {
        this.navPosition.set(savedPos);
      }
      const savedCollapsed = localStorage.getItem(this.COLLAPSED_KEY);
      if (savedCollapsed === 'true') {
        this.sidebarCollapsed.set(true);
      }
    }

    effect(() => {
      if (this.isBrowser) {
        localStorage.setItem(this.POS_KEY, this.navPosition());
        localStorage.setItem(this.COLLAPSED_KEY, String(this.sidebarCollapsed()));
      }
    });
  }

  setNavPosition(pos: NavPosition) {
    this.navPosition.set(pos);
    this.mobileSidebarOpen.set(false);
  }

  toggleNavPosition() {
    this.setNavPosition(this.navPosition() === 'top' ? 'left' : 'top');
  }

  toggleSidebarCollapse() {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen.set(false);
  }
}
