import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Building2, Video, CheckCircle, ShieldCheck } from 'lucide-react';
import { Doctor } from '../types';

interface BookingModalProps {
  doctor: Doctor;
  onClose: () => void;
  onConfirmBooking: (doctor: Doctor, date: string, time: string, type: string) => void;
}

export default function BookingModal({ doctor, onClose, onConfirmBooking }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState('2026-06-12');
  const [selectedTime, setSelectedTime] = useState(doctor.slots[0] || '10:00');
  const [consultType, setConsultType] = useState('Cabinet');
  const [reason, setReason] = useState('Première consultation');

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmBooking(doctor, selectedDate, selectedTime, consultType);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Doctor preview */}
        <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
          <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm" />
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{doctor.specialty}</span>
            <h2 className="text-xl font-black text-slate-900 font-brand">{doctor.name}</h2>
            <p className="text-xs text-slate-500">{doctor.address}</p>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="space-y-6 mt-6">
          {/* Consultation Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Mode de consultation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setConsultType('Cabinet')}
                className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 ${
                  consultType === 'Cabinet' 
                    ? 'border-blue-600 bg-blue-50 text-blue-800' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Au cabinet</span>
              </button>

              <button 
                type="button"
                onClick={() => setConsultType('Vidéo')}
                className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 ${
                  consultType === 'Vidéo' 
                    ? 'border-blue-600 bg-blue-50 text-blue-800' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Video className="w-4 h-4 text-blue-600" />
                <span>Téléconsultation Visio</span>
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Motif de consultation
            </label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value="Première consultation">Première consultation</option>
              <option value="Consultation de suivi">Consultation de suivi</option>
              <option value="Renouvellement de traitement">Renouvellement de traitement</option>
              <option value="Urgence relative">Urgence relative</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Date du rendez-vous</span>
            </label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Créneaux disponibles</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {doctor.slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                    selectedTime === slot 
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                      : 'border-slate-200 text-slate-700 hover:border-blue-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tarif consultation :</span>
            <span className="font-black text-slate-900 text-sm">{doctor.fee}</span>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition text-sm flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Confirmer mon rendez-vous</span>
          </button>

          <p className="text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Réservation sécurisée &bull; Annulation gratuite</span>
          </p>
        </form>
      </div>
    </div>
  );
}
