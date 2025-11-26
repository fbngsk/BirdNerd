import React from 'react';

interface CelebrationOverlayProps {
    show: boolean;
    xp: number;
    onClose: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ show, xp, onClose }) => {
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
                <p className="mt-8 text-sm text-gray-300 opacity-70">Klicken zum Schließen</p>
            </div>
        </div>
    );
};