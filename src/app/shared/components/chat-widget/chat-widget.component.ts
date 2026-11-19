import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService, ChatAction } from '../../../core/services/chat.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent implements AfterViewChecked {
  public chatService = inject(ChatService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = signal<boolean>(false);
  showHistory = signal<boolean>(false);
  showSuggestions = signal<boolean>(true);
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
      this.showSuggestions.set(false);
    }
  }

  askSuggested(question: string) {
    this.chatService.sendMessage(question);
    this.showSuggestions.set(false);
  }

  toggleSuggestions() {
    this.showSuggestions.update(v => !v);
  }

  onModeChange(mode: 'synthese' | 'technique' | 'action') {
    this.chatService.responseMode.set(mode);
  }

  executeAction(act: ChatAction) {
    if (act.type === 'question' && act.payload) {
      this.chatService.sendMessage(act.payload);
    } else if (act.type === 'navigate' && act.payload) {
      this.isOpen.set(false);
      this.router.navigate([act.payload]);
    } else if (act.type === 'download' && act.payload) {
      this.exportMessagePdf(act.payload);
    }
  }

  private async exportMessagePdf(htmlText: string) {
    if (!this.isBrowser) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 16;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(26, 54, 93);
    doc.text('DGTCP — Analyse Assistant Décisionnel', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100);
    doc.text('Exercice 2026   |   Synthèse Consolidée DGTCP / ACCT', 14, y);
    y += 3;
    doc.setDrawColor(210, 220, 235);
    doc.line(14, y, pageW - 14, y);
    y += 7;

    const container = document.createElement('div');
    container.innerHTML = htmlText;
    const rawLines = (container.innerText || container.textContent || '')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    rawLines.forEach((line, idx) => {
      if (idx === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        doc.setTextColor(26, 54, 93);
        const wrapped = doc.splitTextToSize(line, pageW - 28);
        if (y + wrapped.length * 5 > pageH - 14) { doc.addPage(); y = 16; }
        doc.text(wrapped, 14, y);
        y += wrapped.length * 5 + 4;
        return;
      }

      doc.setFontSize(9.5);
      doc.setTextColor(40);
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 45) {
        const prefix = line.slice(0, colonIdx + 1) + ' ';
        const rest = line.slice(colonIdx + 1).trim();
        doc.setFont('helvetica', 'bold');
        const prefixW = doc.getTextWidth(prefix);
        const restLines = doc.splitTextToSize(rest, pageW - 28 - prefixW);
        if (y + restLines.length * 4.8 > pageH - 14) { doc.addPage(); y = 16; }
        doc.text(prefix, 14, y);
        doc.setFont('helvetica', 'normal');
        if (restLines.length > 0) {
          doc.text(restLines[0], 14 + prefixW, y);
          for (let li = 1; li < restLines.length; li++) {
            y += 4.8;
            doc.text(restLines[li], 18, y);
          }
        }
        y += 6.2;
      } else {
        doc.setFont('helvetica', 'normal');
        const wrapped = doc.splitTextToSize(line, pageW - 28);
        if (y + wrapped.length * 4.8 > pageH - 14) { doc.addPage(); y = 16; }
        doc.text(wrapped, 14, y);
        y += wrapped.length * 4.8 + 2;
      }
    });

    const maintenant = new Date();
    const dateImp = maintenant.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const heureImp = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const nbPages = doc.getNumberOfPages();
    for (let p = 1; p <= nbPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Imprimé le ${dateImp} à ${heureImp}`, pageW - 14, pageH - 6, { align: 'right' });
    }

    doc.save('Analyse_Assistant_DGTCP_2026.pdf');
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
