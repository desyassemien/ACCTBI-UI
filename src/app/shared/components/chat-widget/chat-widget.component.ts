import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent implements AfterViewChecked {
  public chatService = inject(ChatService);
  
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = signal<boolean>(false);
  showHistory = signal<boolean>(false);
  userInput = signal<string>('');

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.showHistory.set(false);
    }
  }

  toggleHistory() {
    this.showHistory.update(v => !v);
  }

  startNewChat() {
    this.chatService.createNewThread();
    this.showHistory.set(false);
  }

  selectThread(id: string) {
    this.chatService.setActiveThread(id);
    this.showHistory.set(false);
  }

  sendMessage() {
    const text = this.userInput().trim();
    if (text) {
      this.chatService.sendMessage(text);
      this.userInput.set('');
    }
  }

  private scrollToBottom(): void {
    if (this.isOpen() && this.scrollContainer) {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }
  }

  clearHistory() {
    if (confirm('Voulez-vous vraiment effacer l\'historique de discussion ?')) {
      this.chatService.clearHistory();
    }
  }
}
