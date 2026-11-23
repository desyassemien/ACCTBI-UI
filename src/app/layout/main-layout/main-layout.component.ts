import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ChatWidgetComponent } from '../../shared/components/chat-widget/chat-widget.component';
import { AlertService } from '../../core/services/alert.service';
import { LayoutService } from '../../core/services/layout.service';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, HeaderComponent, SidebarComponent, ChatWidgetComponent],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
    public alertService = inject(AlertService);
    public layoutService = inject(LayoutService);
}
