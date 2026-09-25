import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Download, 
  Receipt, 
  ArrowRight, 
  AlertCircle,
  X
} from 'lucide-react';
import { SaaSSubscriptionInvoice } from '../types';

interface MobileMoneyBillingModalProps {
  doctorName: string;
  clinicName: string;
  planName: 'Starter' | 'Pro Cabinet' | 'Clinique Pro';
  planFeeUSD: number;
  onClose: () => void;
  onPaymentSuccess: (invoice: SaaSSubscriptionInvoice) => void;
}

export default function MobileMoneyBillingModal({
  doctorName,
  clinicName,
  planName,
  planFeeUSD,
  onClose,
  onPaymentSuccess
}: MobileMoneyBillingModalProps) {
  const [operator, setOperator] = useState<'M-Pesa' | 'Orange Money' | 'Airtel Money' | 'Carte Visa/Mastercard'>('M-Pesa');
  const [phoneNumber, setPhoneNumber] = useState('+243 81');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<SaaSSubscriptionInvoice | null>(null);

  // Conversion 1 USD = 2850 CDF
  const exchangeRate = 2850;
  const amountCDF = planFeeUSD * exchangeRate;

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const invoice: SaaSSubscriptionInvoice = {
        id: `FACT-SAAS-${Date.now().toString().slice(-6)}`,
        accountName: doctorName,
        clinicName: clinicName || `Cabinet ${doctorName}`,
        plan: planName,
        amountUSD: planFeeUSD,
        amountCDF: amountCDF,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        paymentMethod: operator,
        phoneNumber: operator !== 'Carte Visa/Mastercard' ? phoneNumber : undefined,
        status: 'Payé',
        transactionRef: `RDC-PAY-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      };

      setIsProcessing(false);
      setCompletedInvoice(invoice);
      onPaymentSuccess(invoice);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 text-slate-900 shadow-2xl relative border border-slate-200 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {completedInvoice ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 font-brand">Abonnement SaaS Réglé !</h3>
            <p className="text-xs text-slate-500 mt-1">
              Votre souscription au plan <strong className="text-blue-600">{completedInvoice.plan}</strong> est active.
            </p>

            {/* Invoice card */}
            <div className="mt-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Référence Facture</span>
                <span className="font-mono font-bold text-blue-700">{completedInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode de règlement</span>
                <span className="font-bold text-slate-800">{completedInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Réf. Transaction</span>
                <span className="font-mono text-slate-700">{completedInvoice.transactionRef}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800">Montant total</span>
                <span className="font-bold text-emerald-600 text-sm">
                  ${completedInvoice.amountUSD} USD ({completedInvoice.amountCDF.toLocaleString('fr-FR')} CDF)
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center space-x-3">
              <button 
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger la Facture</span>
              </button>
              <button 
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
              >
                Accéder au portail
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Paiement Mobile Money RDC
              </span>
              <h2 className="text-xl font-black text-slate-900 font-brand mt-1">Règlement Abonnement Praticien</h2>
              <p className="text-xs text-slate-500">
                Activation immédiate de vos fonctionnalités de gestion et téléconsultation.
              </p>
            </div>

            {/* Subscription summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Plan sélectionné</span>
                <div className="text-base font-bold text-slate-900">{planName}</div>
                <div className="text-xs text-slate-500">{clinicName || doctorName}</div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-blue-600 font-brand">${planFeeUSD} <span className="text-xs text-slate-400 font-sans font-normal">/ mois</span></span>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  &asymp; {amountCDF.toLocaleString('fr-FR')} CDF
                </div>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Sélectionnez le mode de paiement :</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'M-Pesa', name: 'Vodacom M-Pesa', color: 'border-red-300 hover:bg-red-50' },
                    { id: 'Orange Money', name: 'Orange Money', color: 'border-orange-300 hover:bg-orange-50' },
                    { id: 'Airtel Money', name: 'Airtel Money', color: 'border-red-400 hover:bg-red-50' },
                    { id: 'Carte Visa/Mastercard', name: 'Carte Bancaire', color: 'border-blue-300 hover:bg-blue-50' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setOperator(m.id as any)}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        operator === m.id 
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20' 
                          : `${m.color} bg-white`
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800">{m.name}</span>
                      {operator === m.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {operator !== 'Carte Visa/Mastercard' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Numéro de téléphone Mobile Money ({operator}) :
                  </label>
                  <input 
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+243 81 000 0000"
                    required
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Un prompt de validation PIN sera envoyé sur votre téléphone.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Numéro de Carte Bancaire :</label>
                  <input 
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text"
                      placeholder="MM/AA"
                      className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text"
                      placeholder="CVC"
                      className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <span>Traitement de la transaction RDC...</span>
                  ) : (
                    <>
                      <span>Confirmer le paiement de ${planFeeUSD} USD</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Paiement chiffré et sécurisé aux normes bancaires RDC</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
