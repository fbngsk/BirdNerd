import React, { useState, useEffect } from 'react';
import { MapPin, Bird, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface BirdLog {
    bird_id: string;
    bird_name: string;
    lat: number;
    lng: number;
    logged_at: string;
}

interface BirdStatsProps {
    userId: string;
}

export const BirdStats: React.FC<BirdStatsProps> = ({ userId }) => {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<BirdLog[]>([]);
    const [frequentBirds, setFrequentBirds] = useState<{name: string, count: number}[]>([]);
    const [uniqueLocations, setUniqueLocations] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('bird_logs')
                .select('*')
                .eq('user_id', userId)
                .order('logged_at', { ascending: false });

            if (data && !error) {
                setLogs(data);
                
                // Calculate frequent birds
                const birdCounts: Record<string, number> = {};
                const locations = new Set<string>();
                
                data.forEach(log => {
                    // Count birds
                    birdCounts[log.bird_name] = (birdCounts[log.bird_name] || 0) + 1;
                    
                    // Count unique locations
                    if (log.lat && log.lng) {
                        locations.add(`${log.lat},${log.lng}`);
                    }
                });
                
                // Sort and get top 5
                const sorted = Object.entries(birdCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }));
                
                setFrequentBirds(sorted);
                setUniqueLocations(locations.size);
            }
            
            setLoading(false);
        };

        if (userId) {
            fetchStats();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-teal" size={24} />
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-4 text-gray-400 text-sm">
                <MapPin className="mx-auto mb-2 opacity-50" size={24} />
                <p>Noch keine Standort-Daten.</p>
                <p className="text-xs mt-1">Aktiviere GPS beim Loggen!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Location Stats */}
            <div className="bg-teal/5 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-teal" />
                    <span className="font-bold text-teal text-sm">Entdecker-Statistik</span>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1 bg-white rounded-lg p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-teal">{uniqueLocations}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Orte entdeckt</div>
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-3 text-center shadow-sm">
                        <div className="text-2xl font-bold text-orange">{logs.length}</div>
                        <div className="text-[10px] text-gray-400 uppercase">Gesamt Logs</div>
                    </div>
                </div>
            </div>
            
            {/* Mini Heatmap (Simple Grid Visualization) */}
            {uniqueLocations > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-gray-600">🗺️ Deine Vogel-Karte</span>
                    </div>
                    <div className="grid grid-cols-10 gap-0.5 aspect-[2/1] bg-white rounded-lg p-2 shadow-inner">
                        {/* Simple visualization: show dots for locations */}
                        {Array.from({ length: 50 }).map((_, i) => {
                            const hasLog = i < uniqueLocations;
                            return (
                                <div 
                                    key={i}
                                    className={`aspect-square rounded-sm transition-all ${
                                        hasLog 
                                            ? 'bg-teal' + (i < 5 ? '' : i < 15 ? '/80' : '/50')
                                            : 'bg-gray-100'
                                    }`}
                                />
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center mt-2">
                        Jedes Feld = 1 neuer Ort
                    </p>
                </div>
            )}

            {/* Frequent Birds */}
            {frequentBirds.length > 0 && (
                <div className="bg-orange/5 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                        <Bird size={16} className="text-orange" />
                        <span className="font-bold text-orange text-sm">Treue Begleiter</span>
                    </div>
                    <div className="space-y-2">
                        {frequentBirds.map((bird, idx) => (
                            <div 
                                key={bird.name}
                                className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm"
                            >
                                <span className="text-sm font-bold text-gray-400 w-5">{idx + 1}.</span>
                                <span className="flex-1 text-sm font-medium text-gray-700 truncate">{bird.name}</span>
                                <span className="text-xs bg-orange/10 text-orange px-2 py-0.5 rounded-full font-bold">
                                    {bird.count}x
                                </span>
                            </div>
                        ))}
                    </div>
                    {frequentBirds[0]?.count >= 10 && (
                        <div className="mt-3 text-center">
                            <span className="text-xs bg-orange text-white px-3 py-1 rounded-full font-bold">
                                🤝 Treuer Begleiter: {frequentBirds[0].name}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
