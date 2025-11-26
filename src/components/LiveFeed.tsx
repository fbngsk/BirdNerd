import React from 'react';
import { Eye, Plane, MapPin } from 'lucide-react';
import { Bird } from '../types';
import { BirdCard } from './BirdCard';

interface LiveFeedProps {
    birds: Bird[];
    loading: boolean;
    onBirdClick: (bird: Bird) => void;
    onRefresh: () => void;
    isVacationMode: boolean;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ birds, loading, onBirdClick, onRefresh, isVacationMode }) => {
    return (
        <div className="px-6 mt-6 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className={`font-bold text-sm uppercase tracking-wider flex items-center gap-2 ${isVacationMode ? 'text-orange-500' : 'text-gray-500'}`}>
                    {isVacationMode ? <Plane size={14} /> : <Eye size={14} />} 
                    {isVacationMode ? 'Urlaubs-Radar' : 'Aktuell in der Nähe'}
                </h3>
                <button onClick={onRefresh} className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-500 font-bold hover:bg-gray-200 disabled:opacity-50" disabled={loading}>
                    {loading ? '...' : 'Aktualisieren'}
                </button>
            </div>
            
            <div className="space-y-3 min-h-[100px]">
                {loading && birds.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-xs">Suche nach Sichtungen...</div>
                )}
                
                {birds.slice(0, 3).map((bird) => (
                    <BirdCard key={bird.id} bird={bird} onClick={() => onBirdClick(bird)} />
                ))}

                {!loading && birds.length === 0 && (
                    <div className={`text-center py-8 rounded-2xl border border-dashed ${isVacationMode ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="text-2xl mb-2">{isVacationMode ? '🌴' : '🌲'}</div>
                        <p className="text-xs text-gray-500 font-medium">
                            {isVacationMode 
                                ? 'Keine exotischen Vögel entdeckt. Genieße den Strand!' 
                                : 'Gerade ist es ruhig in deiner Umgebung.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};