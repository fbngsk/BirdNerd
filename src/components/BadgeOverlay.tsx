import React from 'react';
import { Badge } from '../types';

interface BadgeOverlayProps {
    badge: Badge | null;
    onClose: () => void;
}

export const BadgeOverlay: React.FC<BadgeOverlayProps> = ({ badge, onClose }) => {
    if (!badge) return null;
    
    return (
        <div 
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in cursor-pointer" 
            onClick={onClose}
        >
            <div className="text-center text-white p-8 max-w-xs w-full relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-teal/20 rounded-full blur-3xl animate-pulse"></div>
                
                <div className="relative z-10">
                    <div className="text-sm uppercase tracking-widest font-bold text-orange mb-4 animate-slide-up">Badge Freigeschaltet</div>
                    
                    <div className="w-32 h-32 bg-gradient-to-br from-teal to-teal-800 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-orange shadow-[0_0_30px_rgba(244,162,97,0.6)] animate-[bounce_2s_infinite]">
                        <span className="text-6xl drop-shadow-lg">{badge.icon}</span>
                    </div>
                    
                    <h2 className="text-3xl font-bold mb-2 text-white animate-slide-up">{badge.title}</h2>
                    <p className="text-gray-200 mb-4 text-sm animate-slide-up delay-100">{badge.description}</p>
                    
                    <div className="inline-block px-4 py-2 bg-white/10 rounded-full border border-white/20 text-sm font-bold text-orange animate-slide-up delay-200">
                        +{badge.xpReward} XP Bonus
                    </div>
                    
                    <p className="mt-10 text-xs text-gray-500">Tippen zum Fortfahren</p>
                </div>
            </div>
        </div>
    );
};