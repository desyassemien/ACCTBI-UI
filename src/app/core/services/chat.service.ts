import { Injectable, signal, effect, computed } from '@angular/core';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly STORAGE_KEY = 'sygacut_chat_threads_v2';
  private readonly MAX_THREADS = 4;
  
  // Signal for all chat threads
  threads = signal<ChatThread[]>([]);
  
  // ID of the currently active thread
  activeThreadId = signal<string | null>(null);

  // Computed signal for the current active messages
  activeMessages = computed(() => {
    const activeId = this.activeThreadId();
    const thread = this.threads().find(t => t.id === activeId);
    return thread ? thread.messages : [];
  });

  constructor() {
    this.loadHistory();
    
    // Auto-save on change
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.threads()));
      if (this.activeThreadId()) {
         localStorage.setItem(this.STORAGE_KEY + '_active', this.activeThreadId()!);
      }
    });
  }

  private loadHistory() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const savedActiveId = localStorage.getItem(this.STORAGE_KEY + '_active');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const history: ChatThread[] = parsed.map((t: any) => ({
          ...t,
          lastUpdated: new Date(t.lastUpdated),
          messages: t.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        this.threads.set(history);
        
        if (savedActiveId && history.some(t => t.id === savedActiveId)) {
          this.activeThreadId.set(savedActiveId);
        } else if (history.length > 0) {
          this.activeThreadId.set(history[0].id);
        }
      } catch (e) {
        console.error('Erreur chargement historique chat:', e);
        this.createNewThread();
      }
    } else {
      this.createNewThread();
    }
  }

  createNewThread() {
    const newId = Date.now().toString();
    const newThread: ChatThread = {
      id: newId,
      title: 'Nouvelle conversation',
      messages: [
        { 
          role: 'assistant', 
          content: 'Bonjour ! Je suis votre assistant SYGACUT-BI. Comment puis-je vous aider dans l\'analyse de vos indicateurs aujourd\'hui ?', 
          timestamp: new Date() 
        }
      ],
      lastUpdated: new Date()
    };

    this.threads.update(prev => {
      const updated = [newThread, ...prev];
      // Keep only fixed number of threads
      return updated.slice(0, this.MAX_THREADS);
    });
    
    this.activeThreadId.set(newId);
  }

  setActiveThread(id: string) {
    if (this.threads().some(t => t.id === id)) {
      this.activeThreadId.set(id);
    }
  }

  sendMessage(content: string) {
    const activeId = this.activeThreadId();
    if (!activeId) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    this.updateActiveThread(userMessage);

    // Update title if it's the first user message
    const thread = this.threads().find(t => t.id === activeId);
    if (thread && thread.messages.filter(m => m.role === 'user').length === 1) {
      this.updateThreadTitle(activeId, content.substring(0, 30) + (content.length > 30 ? '...' : ''));
    }

    // Simulate AI thinking and response
    setTimeout(() => {
      this.generateAIResponse(content);
    }, 1000);
  }

  private updateActiveThread(message: ChatMessage) {
    const activeId = this.activeThreadId();
    this.threads.update(prev => prev.map(t => {
      if (t.id === activeId) {
        return {
          ...t,
          messages: [...t.messages, message],
          lastUpdated: new Date()
        };
      }
      return t;
    }));
  }

  private updateThreadTitle(id: string, title: string) {
    this.threads.update(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, title };
      }
      return t;
    }));
  }

  private generateAIResponse(userText: string) {
    let response = '';
    const text = userText.toLowerCase();

    if (text.includes('trésorerie') || text.includes('position')) {
      response = "La position de trésorerie nette actuelle est de 12,45 Milliards FCFA, en hausse de 5.2% par rapport au mois dernier.";
    } else if (text.includes('budget') || text.includes('exécution')) {
      response = "Le taux d'exécution budgétaire global est de 85.8%. Les dépenses de fonctionnement consomment 60% de l'enveloppe.";
    } else if (text.includes('mandat') || text.includes('rejet')) {
      response = "Nous avons 12 opérations en attente aujourd'hui, principalement des mandats en cours de validation à la Paierie Générale.";
    } else {
      response = "C'est une excellente question. Je peux vous donner des détails sur la trésorerie, l'exécution budgétaire ou les alertes en cours. Que souhaitez-vous approfondir ?";
    }

    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    this.updateActiveThread(aiMessage);
  }

  clearHistory() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY + '_active');
    this.threads.set([]);
    this.createNewThread();
  }
}
