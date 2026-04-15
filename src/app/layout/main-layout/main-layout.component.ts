import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { ChatWidgetComponent } from '../../shared/components/chat-widget/chat-widget.component';
import { AlertService } from '../../core/services/alert.service';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, HeaderComponent, ChatWidgetComponent],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
    public alertService = inject(AlertService);
}
