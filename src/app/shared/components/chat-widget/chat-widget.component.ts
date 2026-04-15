import { Component, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = signal(false);
  isTyping = signal(false);
  userInput = '';
  messages = signal<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Bonjour ! Je suis votre assistant ACCTBI. Comment puis-je vous aider aujourd\'hui ?',
      time: this.currentTime()
    }
  ]);

  private msgIdCounter = 2;

  toggleChat(): void {
    this.isOpen.update(v => !v);
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text) return;

    this.messages.update(msgs => [...msgs, {
      id: this.msgIdCounter++,
      role: 'user',
      text,
      time: this.currentTime()
    }]);
    this.userInput = '';
    this.isTyping.set(true);

    // Simulate assistant reply
    setTimeout(() => {
      this.isTyping.set(false);
      this.messages.update(msgs => [...msgs, {
        id: this.msgIdCounter++,
        role: 'assistant',
        text: this.getAutoReply(text),
        time: this.currentTime()
      }]);
    }, 1200);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch { /* ignore */ }
  }

  private currentTime(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  private getAutoReply(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('solde') || lower.includes('balance')) {
      return 'Pour consulter votre solde, rendez-vous dans la section Comptabilité → Soldes. Souhaitez-vous que je vous y amène ?';
    }
    if (lower.includes('rapport') || lower.includes('report')) {
      return 'Vous pouvez générer vos rapports depuis le tableau de bord. Quel type de rapport vous intéresse ?';
    }
    if (lower.includes('aide') || lower.includes('help')) {
      return 'Je peux vous aider avec : les KPIs financiers, la comptabilité, la trésorerie, les cautionnements et les régies.';
    }
    return 'Merci pour votre message. Notre équipe de support va traiter votre demande. Pour une assistance immédiate, consultez la documentation ACCTBI.';
  }
}
