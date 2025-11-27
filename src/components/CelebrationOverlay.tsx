import React from 'react';
import { MapPin } from 'lucide-react';

interface CelebrationOverlayProps {
    show: boolean;
    xp: number;
    bonus?: number;
    onClose: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ show, xp, bonus, onClose }) => {
    if (!show) return null;
    
    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in cursor-pointer" 
            onClick={onClose}
        >
            <div className="text-center text-white p-8">
                <div className="text-6xl mb-4 animate-bounce-slow">🎉</div>
                <h2 className="text-3xl font-bold mb-2 text-orange animate-pulse-fast">Gefunden!</h2>
                <p className="text-xl">Du hast <span className="font-bold">+{xp} XP</span> erhalten!</p>
                
                {bonus && bonus > 0 && (
                    <div className="mt-4 bg-teal/30 px-4 py-2 rounded-xl inline-flex items-center gap-2 animate-fade-in">
                        <MapPin size={18} className="text-teal" />
                        <span className="text-teal font-bold">+{bonus} XP Entdecker-Bonus!</span>
                    </div>
                )}
                
                <p className="mt-8 text-sm text-gray-300 opacity-70">Klicken zum Schließen</p>
            </div>
        </div>
    );
};
