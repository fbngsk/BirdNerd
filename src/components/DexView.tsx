import React, { useState, useEffect, useCallback } from 'react'; 
import { BIRDS_DB, BIRD_FAMILIES } from '../constants';
import { Bird, LocationType, Swarm } from '../types';
import { Home, Plane, Loader2, Search, X, CheckCircle, Users } from 'lucide-react';
import { getSwarmCollection } from '../services/swarmService';

// Simple cache to avoid re-fetching Wikipedia thumbnails constantly
const THUMBNAIL_CACHE: Record<string, string> = {};

// Mapping for nice Display Names
const FAMILY_LABELS: Record<string, string> = {
    raptors: 'Greifvögel & Falken',
    water: 'Wasser- & Meeresvögel',
    ducks: 'Enten, Gänse & Schwäne',
    owls: 'Eulen',
    waders: 'Watvögel (Limikolen)',
    corvids: 'Rabenvögel',
    tits: 'Meisen',
    finches: 'Finken',
    woodpeckers: 'Spechte',
    thrushes: 'Drosseln & Schmätzer',
    warblers: 'Grasmücken & Sänger',
    pigeons: 'Tauben',
    buntings: 'Ammern',
    other: 'Andere Arten'
};

// Sort order for families
const FAMILY_ORDER = [
    'raptors', 'owls', 'ducks', 'water', 'waders', 
    'woodpeckers', 'corvids', 'tits', 'finches', 'thrushes', 'warblers', 'pigeons', 'buntings', 'other'
];

type DexFilter = 'local' | 'vacation' | 'swarm';

interface DexViewProps {
    collectedIds: string[];
    vacationBirds?: Bird[];
    swarm?: Swarm | null;
    onBirdClick: (bird: Bird) => void;
}

// Individual Card Component
const DexBirdCard = ({ bird, isCollected, onClick }: { bird: Bird, isCollected: boolean, onClick: () => void }) => {
    const initialImage = bird.realImg || THUMBNAIL_CACHE[bird.name] || null;
    const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
    const [loading, setLoading] = useState(!initialImage);

    useEffect(() => {
        if (imageUrl) return; 
        
        if (bird.id.startsWith('vacation_')) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchImage = async () => {
            try {
                const searchName = bird.sciName || bird.name;
                const res = await fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchName)}`);
                if (res.ok) {
                    const data = await res.json();
                    const url = data.thumbnail?.source;
                    if (isMounted && url) {
                        THUMBNAIL_CACHE[bird.name] = url;
                        setImageUrl(url);
                    }
                }
            } catch (error) {
                // silent fail
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        const timer = setTimeout(fetchImage, Math.random() * 1000);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [bird.id, bird.name, bird.sciName, imageUrl]);

    return (
        <div 
            onClick={onClick} 
            className={`aspect-square rounded-3xl p-3 flex flex-col justify-between relative overflow-hidden transition-all cursor-pointer active:scale-95 ${isCollected ? 'bg-white shadow-sm border border-orange' : 'bg-gray-100 border border-transparent opacity-80'}`}
        >
            {isCollected && (
                <div className="absolute top-2 right-2 text-[10px] font-bold text-teal bg-white/60 px-1.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                    ✓
                </div>
            )}
            
            <div className="flex-1 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={bird.name}
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm transition-all ${isCollected ? '' : 'grayscale opacity-50'}`}
                    />
                ) : (
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${isCollected ? 'bg-gray-100' : 'bg-gray-200'}`}>
                        {loading ? (
                            <Loader2 size={20} className="animate-spin text-gray-400" />
                        ) : (
                            <span className="text-2xl opacity-20 grayscale">🐦</span>
                        )}
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className={`font-bold text-xs sm:text-sm truncate ${isCollected ? 'text-teal' : 'text-gray-500'}`}>
                    {bird.name}
                </div>
                <div className="text-[10px] text-gray-400 truncate italic font-serif">
                    {bird.sciName}
                </div>
                {bird.country && isCollected && (
                    <div className="text-[10px] text-orange-500 truncate flex items-center gap-1 mt-0.5">
                        <span>📍</span> {bird.country}
                    </div>
                )}
            </div>
        </div>
    );
};

export const DexView: React.FC<DexViewProps> = ({ collectedIds, vacationBirds = [], swarm, onBirdClick }) => {
    const [filter, setFilter] = useState<DexFilter>('local');
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyCollected, setOnlyCollected] = useState(false);
    const [swarmBirdIds, setSwarmBirdIds] = useState<string[]>([]);
    const [loadingSwarm, setLoadingSwarm] = useState(false);
    
    // Pull-to-refresh state
    const [refreshing, setRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [startY, setStartY] = useState(0);
    const PULL_THRESHOLD = 80;

    // Load swarm collection when tab is selected
    useEffect(() => {
        if (filter === 'swarm' && swarm?.id) {
            setLoadingSwarm(true);
            getSwarmCollection(swarm.id).then(ids => {
                setSwarmBirdIds(ids);
                setLoadingSwarm(false);
            });
        }
    }, [filter, swarm?.id]);
    
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
        }
    }, []);
    
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (startY === 0 || refreshing) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        if (diff > 0 && window.scrollY === 0) {
            setPullDistance(Math.min(diff * 0.5, 120));
        }
    }, [startY, refreshing]);
    
    const handleTouchEnd = useCallback(() => {
        if (pullDistance >= PULL_THRESHOLD && !refreshing) {
            setRefreshing(true);
            Object.keys(THUMBNAIL_CACHE).forEach(key => delete THUMBNAIL_CACHE[key]);
            
            // Reload swarm data if on swarm tab
            if (filter === 'swarm' && swarm?.id) {
                getSwarmCollection(swarm.id).then(ids => {
                    setSwarmBirdIds(ids);
                    setRefreshing(false);
                    setPullDistance(0);
                });
            } else {
                setTimeout(() => {
                    setRefreshing(false);
                    setPullDistance(0);
                }, 1000);
            }
        } else {
            setPullDistance(0);
        }
        setStartY(0);
    }, [pullDistance, refreshing, filter, swarm?.id]);

    // Determine which IDs to use for "collected" status
    const activeCollectedIds = filter === 'swarm' ? swarmBirdIds : collectedIds;
    
    // Filter Birds
    let filteredBirds: Bird[] = [];
    
    if (filter === 'vacation') {
        filteredBirds = [...BIRDS_DB.filter(b => b.locationType === 'vacation'), ...vacationBirds];
    } else if (filter === 'swarm') {
        // Show all local birds, mark swarm-collected ones
        filteredBirds = BIRDS_DB.filter(b => {
            const type = b.locationType || 'local';
            return type === 'local';
        });
    } else {
        filteredBirds = BIRDS_DB.filter(b => {
            const type = b.locationType || 'local';
            return type === 'local';
        });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredBirds = filteredBirds.filter(b => 
            b.name.toLowerCase().includes(term) || 
            b.sciName.toLowerCase().includes(term)
        );
    }
    
    // Apply collected filter
    if (onlyCollected) {
        filteredBirds = filteredBirds.filter(b => activeCollectedIds.includes(b.id));
    }

    const collectedCount = filteredBirds.filter(b => activeCollectedIds.includes(b.id)).length;
    const totalCount = filter === 'local' 
        ? BIRDS_DB.filter(b => (b.locationType || 'local') === 'local').length 
        : filter === 'swarm'
            ? BIRDS_DB.filter(b => (b.locationType || 'local') === 'local').length
            : filteredBirds.length;

    // Group Birds by Family
    const groupedBirds = filteredBirds.reduce((acc, bird) => {
        let familyKey = 'other';
        
        for (const [key, prefixes] of Object.entries(BIRD_FAMILIES)) {
            if (prefixes.some(prefix => bird.sciName.includes(prefix))) {
                familyKey = key;
                break;
            }
        }
        
        if (!acc[familyKey]) acc[familyKey] = [];
        acc[familyKey].push(bird);
        return acc;
    }, {} as Record<string, Bird[]>);

    return (
         <div 
            className="p-6 pb-32 animate-fade-in"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
         >
            {/* Pull-to-refresh indicator */}
            {(pullDistance > 0 || refreshing) && (
                <div 
                    className="flex items-center justify-center mb-4 transition-all"
                    style={{ height: refreshing ? 40 : pullDistance * 0.5 }}
                >
                    <Loader2 
                        size={24} 
                        className={`text-teal ${refreshing ? 'animate-spin' : ''}`}
                        style={{ 
                            opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
                            transform: `rotate(${pullDistance * 2}deg)`
                        }}
                    />
                </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-teal">Sammlung</h2>
                <div className="text-xs font-bold px-3 py-1 bg-gray-100 rounded-full text-gray-500">
                    {filter === 'vacation' 
                        ? `${collectedCount} entdeckt`
                        : `${collectedCount} / ${totalCount}`
                    }
                </div>
            </div>

            {/* Tabs - 3 Tabs now */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
                <button 
                    onClick={() => setFilter('local')} 
                    className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${filter === 'local' ? 'bg-white text-teal shadow-sm' : 'text-gray-400'}`}
                >
                    <Home size={14}/> Heimat
                </button>
                <button 
                    onClick={() => setFilter('swarm')} 
                    className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${filter === 'swarm' ? 'bg-white text-teal shadow-sm' : 'text-gray-400'}`}
                    disabled={!swarm}
                >
                    <Users size={14}/> Schwarm
                </button>
                <button 
                    onClick={() => setFilter('vacation')} 
                    className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${filter === 'vacation' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'}`}
                >
                    <Plane size={14}/> Urlaub
                </button>
            </div>

            {/* Swarm Info Banner */}
            {filter === 'swarm' && swarm && (
                <div className="mb-4 p-3 bg-teal/10 border border-teal/20 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-bold text-teal text-sm">{swarm.name}</div>
                            <div className="text-xs text-gray-500">Gemeinsame Sammlung deines Schwarms</div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-teal">{swarmBirdIds.length}</div>
                            <div className="text-[10px] text-gray-400">Arten</div>
                        </div>
                    </div>
                </div>
            )}

            {/* No Swarm Message */}
            {filter === 'swarm' && !swarm && (
                <div className="mb-4 p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
                    <div className="text-4xl mb-2">🪺</div>
                    <div className="font-bold text-gray-600 mb-1">Kein Schwarm</div>
                    <div className="text-xs text-gray-400">Tritt einem Schwarm bei, um die gemeinsame Sammlung zu sehen.</div>
                </div>
            )}
            
            {/* Search + Filter Row */}
            <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Vogel suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-10 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 text-sm"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                
                <button
                    onClick={() => setOnlyCollected(!onlyCollected)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-1.5 transition-all shrink-0 ${
                        onlyCollected 
                            ? 'bg-teal text-white border-teal' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-teal'
                    }`}
                >
                    <CheckCircle size={16} />
                </button>
            </div>
            
            {/* Active filter indicator */}
            {onlyCollected && (
                <div className="flex items-center gap-2 mb-4 text-xs text-teal bg-teal/10 px-3 py-2 rounded-lg">
                    <CheckCircle size={14} />
                    <span>Nur gesammelte Vögel</span>
                    <button onClick={() => setOnlyCollected(false)} className="ml-auto text-teal/60 hover:text-teal">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Loading state for swarm */}
            {filter === 'swarm' && loadingSwarm && (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-teal" size={32} />
                </div>
            )}

            {/* Bird Grid */}
            {!(filter === 'swarm' && loadingSwarm) && (
                <div className="space-y-8">
                    {FAMILY_ORDER.map(familyKey => {
                        const birds = groupedBirds[familyKey];
                        if (!birds || birds.length === 0) return null;

                        const familyCollected = birds.filter(b => activeCollectedIds.includes(b.id)).length;

                        return (
                            <div key={familyKey} className="animate-slide-up">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h3 className="text-sm font-bold text-teal uppercase tracking-wider opacity-80">
                                        {FAMILY_LABELS[familyKey] || 'Sonstige'}
                                    </h3>
                                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                        {familyCollected}/{birds.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {birds.map((bird) => (
                                        <DexBirdCard 
                                            key={bird.id}
                                            bird={bird}
                                            isCollected={activeCollectedIds.includes(bird.id)}
                                            onClick={() => onBirdClick(bird)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {filteredBirds.length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <Search size={40} className="mx-auto mb-4 opacity-30" />
                            <p className="font-medium">
                                {searchTerm 
                                    ? `Kein Vogel gefunden für "${searchTerm}"`
                                    : onlyCollected 
                                        ? 'Noch keine Vögel gesammelt'
                                        : 'Keine Vögel in dieser Kategorie'
                                }
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
