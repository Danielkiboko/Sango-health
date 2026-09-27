/**
 * SangO Health - WebRTC & LiveKit Teleconsultation Engine
 * Supporte le WebRTC P2P direct natif (avec STUN Google) et LiveKit SFU Cloud.
 */

import { Room, RoomEvent, RemoteTrack, RemoteParticipant, Track } from 'livekit-client';
import { supabase } from './supabase';

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

export type TeleconsultEngine = 'webrtc-p2p' | 'livekit' | 'jitsi';

export interface WebRTCSignalMessage {
  type: 'offer' | 'answer' | 'candidate' | 'user-joined' | 'user-left';
  senderRole: 'doctor' | 'patient';
  senderName: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface WebRTCConnectionStatus {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  hasLocalAudio: boolean;
  hasLocalVideo: boolean;
  isScreenSharing: boolean;
  remoteUserConnected: boolean;
}

/**
 * Gestionnaire WebRTC P2P avec signalisation temps réel Supabase et BroadcastChannel
 */
export class NativeWebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private roomId: string;
  private userRole: 'doctor' | 'patient';
  private userName: string;
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onStatusChangeCallback?: (status: Partial<WebRTCConnectionStatus>) => void;

  constructor(
    roomId: string,
    userRole: 'doctor' | 'patient',
    userName: string,
    callbacks?: {
      onRemoteStream?: (stream: MediaStream) => void;
      onStatusChange?: (status: Partial<WebRTCConnectionStatus>) => void;
    }
  ) {
    this.roomId = roomId;
    this.userRole = userRole;
    this.userName = userName;
    this.onRemoteStreamCallback = callbacks?.onRemoteStream;
    this.onStatusChangeCallback = callbacks?.onStatusChange;
  }

  public async startLocalStream(video = true, audio = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false
      });
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.warn('[WebRTC] Accès caméra/micro non autorisé ou indisponible:', err);
      // Fallback: flux factice ou canvas pour démonstration
      throw err;
    }
  }

  public async initPeerConnection(): Promise<RTCPeerConnection> {
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this.remoteStream = new MediaStream();

    // Ajouter les pistes locales au PeerConnection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });
    }

    // Réception du flux distant
    this.pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      if (this.remoteStream && this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
      this.onStatusChangeCallback?.({ remoteUserConnected: true });
    };

    // Événement d'échange ICE Candidate
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'candidate',
          senderRole: this.userRole,
          senderName: this.userName,
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Suivi de l'état de connexion
    this.pc.onconnectionstatechange = () => {
      if (this.pc) {
        this.onStatusChangeCallback?.({
          connectionState: this.pc.connectionState,
          iceConnectionState: this.pc.iceConnectionState,
          remoteUserConnected: this.pc.connectionState === 'connected'
        });
      }
    };

    // Initialiser les canaux de signalisation
    this.setupSignaling();

    return this.pc;
  }

  private setupSignaling() {
    const channelName = `sango_teleconsult_${this.roomId}`;

    // 1. Canal local BroadcastChannel (pour tests rapides entre onglets/fenêtres)
    try {
      this.broadcastChannel = new BroadcastChannel(channelName);
      this.broadcastChannel.onmessage = (event) => {
        const signal: WebRTCSignalMessage = event.data;
        if (signal && signal.senderRole !== this.userRole) {
          this.handleIncomingSignal(signal);
        }
      };
    } catch (e) {
      console.warn('[WebRTC] BroadcastChannel non supporté:', e);
    }

    // 2. Canal Supabase Realtime Broadcast (pour consultations distantes via Internet)
    if (supabase) {
      try {
        this.supabaseChannel = supabase.channel(channelName, {
          config: { broadcast: { self: false } }
        });

        this.supabaseChannel.on('broadcast', { event: 'webrtc-signal' }, ({ payload }: { payload: WebRTCSignalMessage }) => {
          if (payload && payload.senderRole !== this.userRole) {
            this.handleIncomingSignal(payload);
          }
        });

        this.supabaseChannel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            // Notifier l'autre participant de notre arrivée
            this.sendSignal({
              type: 'user-joined',
              senderRole: this.userRole,
              senderName: this.userName
            });

            // Le médecin initie automatiquement l'offre WebRTC s'il est prêt
            if (this.userRole === 'doctor') {
              setTimeout(() => this.createOffer(), 1000);
            }
          }
        });
      } catch (err) {
        console.warn('[WebRTC] Erreur canal Supabase Realtime:', err);
      }
    } else {
      // Si Supabase n'est pas encore configuré, annoncer sur le canal local
      setTimeout(() => {
        this.sendSignal({
          type: 'user-joined',
          senderRole: this.userRole,
          senderName: this.userName
        });
        if (this.userRole === 'doctor') {
          setTimeout(() => this.createOffer(), 800);
        }
      }, 500);
    }
  }

  private sendSignal(signal: WebRTCSignalMessage) {
    // Envoi via Supabase si disponible
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: signal
        });
      } catch (e) {
        console.warn('[WebRTC] Envoi signal Supabase échoué:', e);
      }
    }

    // Envoi via BroadcastChannel local
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(signal);
      } catch (e) {
        console.warn('[WebRTC] Envoi signal local échoué:', e);
      }
    }
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit | null> {
    if (!this.pc) return null;
    try {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await this.pc.setLocalDescription(offer);
      this.sendSignal({
        type: 'offer',
        senderRole: this.userRole,
        senderName: this.userName,
        sdp: offer
      });
      return offer;
    } catch (err) {
      console.error('[WebRTC] Erreur création offre:', err);
      return null;
    }
  }

  private async handleIncomingSignal(signal: WebRTCSignalMessage) {
    if (!this.pc) return;

    try {
      if (signal.type === 'user-joined') {
        // Un nouvel utilisateur a rejoint la salle : si on est médecin, on relance l'offre
        if (this.userRole === 'doctor') {
          await this.createOffer();
        }
      } else if (signal.type === 'offer' && signal.sdp) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.sendSignal({
          type: 'answer',
          senderRole: this.userRole,
          senderName: this.userName,
          sdp: answer
        });
      } else if (signal.type === 'answer' && signal.sdp) {
        if (this.pc.signalingState !== 'stable') {
          await this.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === 'candidate' && signal.candidate) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.warn('[WebRTC] Erreur ajout ICE Candidate:', e);
        }
      }
    } catch (err) {
      console.error('[WebRTC] Erreur traitement signal:', err);
    }
  }

  public toggleAudio(enable?: boolean): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = enable !== undefined ? enable : !audioTrack.enabled;
      this.onStatusChangeCallback?.({ hasLocalAudio: audioTrack.enabled });
      return audioTrack.enabled;
    }
    return false;
  }

  public toggleVideo(enable?: boolean): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = enable !== undefined ? enable : !videoTrack.enabled;
      this.onStatusChangeCallback?.({ hasLocalVideo: videoTrack.enabled });
      return videoTrack.enabled;
    }
    return false;
  }

  public async startScreenShare(): Promise<MediaStream | null> {
    if (!this.pc) return null;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      this.screenStream = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      // Remplacer la piste vidéo dans le RTCPeerConnection
      const senders = this.pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(screenTrack);
      }

      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      this.onStatusChangeCallback?.({ isScreenSharing: true });
      return screenStream;
    } catch (err) {
      console.warn('[WebRTC] Partage d’écran annulé ou refusé:', err);
      return null;
    }
  }

  public async stopScreenShare(): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }

    // Rétablir la caméra locale
    if (this.pc && this.localStream) {
      const camTrack = this.localStream.getVideoTracks()[0];
      const senders = this.pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender && camTrack) {
        await videoSender.replaceTrack(camTrack);
      }
    }

    this.onStatusChangeCallback?.({ isScreenSharing: false });
  }

  public cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    if (this.supabaseChannel && supabase) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }
  }
}

/**
 * Connecteur LiveKit SFU Cloud
 */
export class LiveKitManager {
  private room: Room | null = null;
  private onRemoteTrackCallback?: (track: RemoteTrack, participant: RemoteParticipant) => void;

  constructor(callbacks?: {
    onRemoteTrack?: (track: RemoteTrack, participant: RemoteParticipant) => void;
  }) {
    this.onRemoteTrackCallback = callbacks?.onRemoteTrack;
  }

  public async connect(url: string, token: string): Promise<Room> {
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true
    });

    this.room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: any, participant: RemoteParticipant) => {
      if (this.onRemoteTrackCallback) {
        this.onRemoteTrackCallback(track, participant);
      }
    });

    await this.room.connect(url, token);
    await this.room.localParticipant.enableCameraAndMicrophone();

    return this.room;
  }

  public async disconnect() {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }
  }
}
