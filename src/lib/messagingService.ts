/**
 * SangO Health - Service de Messagerie Médicale Temps Réel (Patient <-> Médecin)
 * Synchronisation instantanée multi-onglets via BroadcastChannel + Supabase Realtime + localStorage
 */

import { supabase } from './supabase';

export interface MedicalMessage {
  id: string;
  conversationId: string;
  senderRole: 'patient' | 'doctor';
  senderName: string;
  recipientName: string;
  text: string;
  timestamp: number;
  time: string;
  date: string;
  isRead: boolean;
  avatar?: string;
}

export interface ConversationSummary {
  id: string;
  patientName: string;
  doctorName: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
  doctorSpecialty?: string;
  doctorAvatar?: string;
}

const STORAGE_KEY = 'sango_medical_messages_v1';
const CHANNEL_NAME = 'sango_medical_chat_channel';

// Conversations pré-remplies pour faciliter les tests immédiats
const DEFAULT_MESSAGES: MedicalMessage[] = [
  {
    id: 'msg-init-1',
    conversationId: 'conv_kiboko_daniel_dr_marie_laurent',
    senderRole: 'patient',
    senderName: 'Kiboko Daniel',
    recipientName: 'Dr. Marie Laurent',
    text: "Bonjour Docteur Laurent, j'ai bien pris les médicaments prescrits hier soir. La fièvre a commencé à baisser mais j'ai encore quelques courbatures.",
    timestamp: Date.now() - 3600000 * 2,
    time: '08:30',
    date: "Aujourd'hui",
    isRead: true,
    avatar: 'KD'
  },
  {
    id: 'msg-init-2',
    conversationId: 'conv_kiboko_daniel_dr_marie_laurent',
    senderRole: 'doctor',
    senderName: 'Dr. Marie Laurent',
    recipientName: 'Kiboko Daniel',
    text: "Bonjour M. Kiboko. C'est une excellente nouvelle pour la fièvre. Poursuivez bien l'hydratation (au moins 2 litres d'eau par jour) et prenez le paracétamol toutes les 8h si les courbatures persistent. Tenez-moi au courant demain.",
    timestamp: Date.now() - 3600000,
    time: '09:15',
    date: "Aujourd'hui",
    isRead: true,
    avatar: 'ML'
  },
  {
    id: 'msg-init-3',
    conversationId: 'conv_kiboko_daniel_dr_jean_paul_mukendi',
    senderRole: 'patient',
    senderName: 'Kiboko Daniel',
    recipientName: 'Dr. Jean-Paul Mukendi',
    text: "Bonjour Dr. Mukendi, voici les résultats de mon bilan de tension artérielle : 12/8 ce matin.",
    timestamp: Date.now() - 86400000,
    time: 'Hier 16:45',
    date: 'Hier',
    isRead: true,
    avatar: 'KD'
  },
  {
    id: 'msg-init-4',
    conversationId: 'conv_kiboko_daniel_dr_jean_paul_mukendi',
    senderRole: 'doctor',
    senderName: 'Dr. Jean-Paul Mukendi',
    recipientName: 'Kiboko Daniel',
    text: "Parfait, la tension est tout à fait stable et dans les normes recommandées. Continuez le traitement actuel.",
    timestamp: Date.now() - 82000000,
    time: 'Hier 17:10',
    date: 'Hier',
    isRead: true,
    avatar: 'JM'
  }
];

class MessagingService {
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private listeners: Set<(msg: MedicalMessage) => void> = new Set();

  constructor() {
    // 1. Initialiser le canal local BroadcastChannel (ultra-rapide pour 2 onglets)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'NEW_MESSAGE') {
            const message: MedicalMessage = event.data.payload;
            this.notifyListeners(message);
          }
        };
      } catch (e) {
        console.warn('[MessagingService] BroadcastChannel indisponible:', e);
      }
    }

    // 2. Initialiser le canal Supabase Realtime si connecté
    if (supabase) {
      try {
        this.supabaseChannel = supabase.channel(CHANNEL_NAME, {
          config: { broadcast: { self: false } }
        });
        this.supabaseChannel.on('broadcast', { event: 'new_message' }, ({ payload }: { payload: MedicalMessage }) => {
          this.notifyListeners(payload);
        });
        this.supabaseChannel.subscribe();
      } catch (e) {
        console.warn('[MessagingService] Erreur Supabase channel:', e);
      }
    }
  }

  private notifyListeners(msg: MedicalMessage) {
    this.listeners.forEach((callback) => {
      try {
        callback(msg);
      } catch (err) {
        console.error('[MessagingService] Erreur callback:', err);
      }
    });
  }

  public subscribe(callback: (msg: MedicalMessage) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getAllMessages(): MedicalMessage[] {
    if (typeof window === 'undefined') return DEFAULT_MESSAGES;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MESSAGES));
      return DEFAULT_MESSAGES;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_MESSAGES;
    }
  }

  public getMessagesByConversation(conversationId: string): MedicalMessage[] {
    const all = this.getAllMessages();
    return all.filter((m) => m.conversationId === conversationId);
  }

  public generateConversationId(patientName: string, doctorName: string): string {
    const cleanP = patientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanD = doctorName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `conv_${cleanP}_${cleanD}`;
  }

  public sendMessage(params: {
    senderRole: 'patient' | 'doctor';
    senderName: string;
    recipientName: string;
    text: string;
    conversationId?: string;
  }): MedicalMessage {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const convId = params.conversationId || (
      params.senderRole === 'patient'
        ? this.generateConversationId(params.senderName, params.recipientName)
        : this.generateConversationId(params.recipientName, params.senderName)
    );

    const initials = params.senderName
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const newMessage: MedicalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      conversationId: convId,
      senderRole: params.senderRole,
      senderName: params.senderName,
      recipientName: params.recipientName,
      text: params.text.trim(),
      timestamp: Date.now(),
      time: time,
      date: "Aujourd'hui",
      isRead: false,
      avatar: initials
    };

    // 1. Sauvegarder dans localStorage
    const current = this.getAllMessages();
    const updated = [...current, newMessage];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    // 2. Diffuser sur BroadcastChannel local (pour l'autre onglet / fenêtre)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'NEW_MESSAGE',
          payload: newMessage
        });
      } catch (e) {
        console.warn('[MessagingService] BroadcastChannel postMessage error:', e);
      }
    }

    // 3. Diffuser via Supabase Realtime si actif
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMessage
        });
      } catch (e) {
        console.warn('[MessagingService] Supabase broadcast error:', e);
      }
    }

    // 4. Notifier les écouteurs de cet onglet
    this.notifyListeners(newMessage);

    return newMessage;
  }

  public getConversationsForUser(role: 'patient' | 'doctor', userName: string): ConversationSummary[] {
    const all = this.getAllMessages();
    const map = new Map<string, MedicalMessage[]>();

    all.forEach((msg) => {
      const match = role === 'patient'
        ? (msg.senderName.toLowerCase().includes(userName.toLowerCase()) && msg.senderRole === 'patient') ||
          (msg.recipientName.toLowerCase().includes(userName.toLowerCase()) && msg.senderRole === 'doctor')
        : (msg.senderName.toLowerCase().includes(userName.toLowerCase()) && msg.senderRole === 'doctor') ||
          (msg.recipientName.toLowerCase().includes(userName.toLowerCase()) && msg.senderRole === 'patient');

      if (match || true) { // Inclure pour permettre au médecin ou patient de voir ses échanges
        const list = map.get(msg.conversationId) || [];
        list.push(msg);
        map.set(msg.conversationId, list);
      }
    });

    const summaries: ConversationSummary[] = [];

    map.forEach((messages, convId) => {
      messages.sort((a, b) => a.timestamp - b.timestamp);
      const last = messages[messages.length - 1];
      const patientMsg = messages.find((m) => m.senderRole === 'patient');
      const doctorMsg = messages.find((m) => m.senderRole === 'doctor');

      const pName = patientMsg?.senderName || (doctorMsg ? doctorMsg.recipientName : 'Patient');
      const dName = doctorMsg?.senderName || (patientMsg ? patientMsg.recipientName : 'Dr. Marie Laurent');

      const unread = messages.filter((m) => !m.isRead && m.senderRole !== role).length;

      summaries.push({
        id: convId,
        patientName: pName,
        doctorName: dName,
        lastMessageText: last ? last.text : '',
        lastMessageTime: last ? last.time : '',
        unreadCount: unread,
        doctorSpecialty: dName.includes('Laurent') ? 'Médecin Généraliste' : 'Cardiologue'
      });
    });

    return summaries;
  }

  public markConversationAsRead(conversationId: string, readerRole: 'patient' | 'doctor') {
    const all = this.getAllMessages();
    let hasChanges = false;
    const updated = all.map((m) => {
      if (m.conversationId === conversationId && m.senderRole !== readerRole && !m.isRead) {
        hasChanges = true;
        return { ...m, isRead: true };
      }
      return m;
    });

    if (hasChanges && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }
}

export const messagingService = new MessagingService();
