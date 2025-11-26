import React from 'react';
import { Bird as BirdIcon } from 'lucide-react';
import { Bird } from '../types';

interface BirdCardProps {
    bird: Bird;
    onClick: () => void;
}

export const BirdCard: React.FC<BirdCardProps> = ({ bird, onClick }) => {
    return (
        <div 
            onClick={onClick} 
            className="bg-white p-3 rounded-2xl shadow-sm flex items-start gap-4 border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer animate-fade-in"
        >
            <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                {bird.realImg ? 
                    <img src={bird.realImg} alt={bird.name} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><BirdIcon /></div>
                }
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-teal truncate">{bird.name}</h4>
                    <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-500 whitespace-nowrap">
                        {bird.seenAt || 'gerade'}
                    </span>
                </div>
                <p className="text-xs text-gray-500 italic truncate font-serif">
                    {bird.sciName}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                    {bird.realDesc || 'Keine Daten verfügbar.'}
                </p>
            </div>
        </div>
    );
};