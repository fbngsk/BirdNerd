import React from 'react';
import { MapPin, Users, Shield, X } from 'lucide-react';

interface LocationShareModalProps {
  birdName: string;
  onChoice: (choice: 'always' | 'once' | 'never') => void;
  onClose: () => void;
}

export const LocationShareModal: React.FC<LocationShareModalProps> = ({ 
  birdName, 
  onChoice, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal to-cyan-500 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin size={32} />
          </div>
          <h3 className="font-bold text-xl">Standort teilen?</h3>
          <p className="text-teal-100 text-sm mt-1">
            Hilf anderen, den <strong>{birdName}</strong> zu finden!
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-teal" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Community Radar</p>
                <p className="text-xs text-gray-500">Andere Birder können sehen, wo dieser Vogel gesichtet wurde.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-teal" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Datenschutz</p>
                <p className="text-xs text-gray-500">Dein genauer Standort wird auf ~200m gerundet. Dein Name bleibt anonym.</p>
              </div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => onChoice('always')}
              className="w-full py-3 bg-teal text-white rounded-xl font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin size={18} />
              Immer teilen
            </button>
            
            <button
              onClick={() => onChoice('once')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Nur diesmal
            </button>
            
            <button
              onClick={() => onChoice('never')}
              className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
            >
              Nicht teilen
            </button>
          </div>
          
          <p className="text-[10px] text-gray-400 text-center">
            Du kannst diese Einstellung jederzeit in deinem Profil ändern.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// UNUSUAL SIGHTING WARNING MODAL
// ============================================

interface UnusualSightingModalProps {
  birdName: string;
  reason: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const UnusualSightingModal: React.FC<UnusualSightingModalProps> = ({
  birdName,
  reason,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl max-w-sm w-full shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="font-bold text-xl">Ungewöhnliche Sichtung</h3>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-gray-700">
              Du möchtest einen <strong className="text-orange-600">{birdName}</strong> an diesem Standort loggen.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {reason}
            </p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm text-orange-800">
              <strong>Bist du sicher?</strong><br/>
              Falls ja, wird die Sichtung zur Überprüfung markiert.
            </p>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
            >
              Ja, wirklich!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
