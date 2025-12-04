import React, { useState, useEffect } from 'react';
import { X, Bird, Users, Copy, Check, LogOut, Edit3, Link, Loader2, Crown, Trophy } from 'lucide-react';
import { Swarm, SwarmMember, UserProfile } from '../types';
import { getAvatarUrl } from '../services/birdService';
import { 
    createSwarm, 
    joinSwarm, 
    leaveSwarm, 
    renameSwarm, 
    getSwarmDetails,
    getSwarmCollection,
    MAX_MEMBERS 
} from '../services/swarmService';
import { BIRDS_DB } from '../constants';

interface SwarmViewProps {
    currentUser: UserProfile;
    swarm: Swarm | null;
    onSwarmChange: (swarm: Swarm | null) => void;
    onClose: () => void;
}

export const SwarmView: React.FC<SwarmViewProps> = ({
    currentUser,
    swarm,
    onSwarmChange,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'collection'>('info');
    const [members, setMembers] = useState<SwarmMember[]>([]);
    const [swarmBirdIds, setSwarmBirdIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    // Create/Join State
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [newSwarmName, setNewSwarmName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    
    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    
    // Copy State
    const [copied, setCopied] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const isFounder = swarm?.founderId === currentUser.id;
    const totalBirds = BIRDS_DB.length;

    // Load swarm details
    useEffect(() => {
        if (swarm) {
            loadSwarmData();
        }
    }, [swarm]);

    const loadSwarmData = async () => {
        if (!swarm) return;
        setLoading(true);
        try {
            const { members: m } = await getSwarmDetails(swarm.id);
            setMembers(m);
            
            const birdIds = await getSwarmCollection(swarm.id);
            setSwarmBirdIds(birdIds);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newSwarmName.trim() || newSwarmName.length < 3) {
            setError('Name muss mindestens 3 Zeichen haben.');
            return;
        }
        if (!currentUser.id) {
            setError('Du musst eingeloggt sein.');
            return;
        }

        setLoading(true);
        setError(null);
        
        const result = await createSwarm(currentUser.id, newSwarmName);
        
        if (result.success && result.swarm) {
            onSwarmChange(result.swarm);
            setSuccess('Schwarm erstellt! 🎉');
            setShowCreate(false);
            setNewSwarmName('');
        } else {
            setError(result.error || 'Fehler beim Erstellen.');
        }
        setLoading(false);
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) {
            setError('Bitte gib einen Code ein.');
            return;
        }
        if (!currentUser.id) {
            setError('Du musst eingeloggt sein.');
            return;
        }

        setLoading(true);
        setError(null);
        
        const result = await joinSwarm(currentUser.id, joinCode);
        
        if (result.success && result.swarm) {
            onSwarmChange(result.swarm);
            setSuccess(`Willkommen im Schwarm "${result.swarm.name}"! 🐦`);
            setShowJoin(false);
            setJoinCode('');
        } else {
            setError(result.error || 'Fehler beim Beitreten.');
        }
        setLoading(false);
    };

    const handleLeave = async () => {
        if (!confirm(isFounder 
            ? 'Als Gründer wird die Leitung an das nächste Mitglied übergeben. Wirklich verlassen?' 
            : 'Möchtest du den Schwarm wirklich verlassen?'
        )) return;

        if (!currentUser.id) return;

        setLoading(true);
        const result = await leaveSwarm(currentUser.id);
        
        if (result.success) {
            onSwarmChange(null);
            setSuccess('Du hast den Schwarm verlassen.');
        } else {
            setError(result.error || 'Fehler beim Verlassen.');
        }
        setLoading(false);
    };

    const handleRename = async () => {
        if (!editName.trim() || editName.length < 3) {
            setError('Name muss mindestens 3 Zeichen haben.');
            return;
        }
        if (!currentUser.id || !swarm) return;

        setLoading(true);
        const result = await renameSwarm(currentUser.id, swarm.id, editName);
        
        if (result.success) {
            onSwarmChange({ ...swarm, name: editName.trim() });
            setIsEditing(false);
            setSuccess('Schwarm umbenannt!');
        } else {
            setError(result.error || 'Fehler beim Umbenennen.');
        }
        setLoading(false);
    };

    const copyCode = () => {
        if (swarm) {
            navigator.clipboard.writeText(swarm.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const copyInviteLink = () => {
        if (swarm) {
            const link = `https://birbz.de/s/${swarm.inviteCode}`;
            navigator.clipboard.writeText(link);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    const shareInvite = async () => {
        if (!swarm) return;
        const link = `https://birbz.de/s/${swarm.inviteCode}`;
        const text = `Komm in meinen Schwarm "${swarm.name}" bei Birbz! 🐦`;
        
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Schwarm-Einladung', text, url: link });
            } catch (err) {
                copyInviteLink();
            }
        } else {
            copyInviteLink();
        }
    };

    // Clear messages after delay
    useEffect(() => {
        if (error) {
            const t = setTimeout(() => setError(null), 4000);
            return () => clearTimeout(t);
        }
    }, [error]);

    useEffect(() => {
        if (success) {
            const t = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(t);
        }
    }, [success]);

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-white w-full max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up flex flex-col">
                
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
                    <h2 className="font-bold text-lg text-teal flex items-center gap-2">
                        <Bird size={20} className="text-orange" />
                        {swarm ? swarm.name : 'Mein Schwarm'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-fade-in">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 animate-fade-in">
                        {success}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {/* Kein Schwarm - Create/Join */}
                    {!swarm && !showCreate && !showJoin && (
                        <div className="p-6 text-center">
                            <div className="w-20 h-20 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                                🪺
                            </div>
                            <h3 className="font-bold text-teal text-lg mb-2">Noch kein Schwarm</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Gründe deinen eigenen Schwarm oder tritt einem bei. 
                                Zusammen könnt ihr alle {totalBirds} Vogelarten sammeln!
                            </p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="w-full py-3 bg-orange text-white rounded-xl font-bold text-sm shadow-lg shadow-orange/20 hover:bg-orange-600 transition-all active:scale-95"
                                >
                                    🪺 Schwarm gründen
                                </button>
                                <button
                                    onClick={() => setShowJoin(true)}
                                    className="w-full py-3 bg-teal text-white rounded-xl font-bold text-sm shadow-lg shadow-teal/20 hover:bg-teal-700 transition-all active:scale-95"
                                >
                                    🔗 Mit Code beitreten
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Create Form */}
                    {showCreate && (
                        <div className="p-6">
                            <button 
                                onClick={() => setShowCreate(false)}
                                className="text-sm text-gray-400 mb-4 hover:text-teal"
                            >
                                ← Zurück
                            </button>
                            <h3 className="font-bold text-teal text-lg mb-4">Schwarm gründen</h3>
                            
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 mb-2">Schwarm-Name</label>
                                <input
                                    type="text"
                                    value={newSwarmName}
                                    onChange={(e) => setNewSwarmName(e.target.value)}
                                    placeholder="z.B. Vogelfreunde Neukölln"
                                    maxLength={50}
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                                />
                                <p className="text-xs text-gray-400 mt-1">{newSwarmName.length}/50 Zeichen</p>
                            </div>
                            
                            <button
                                onClick={handleCreate}
                                disabled={loading || newSwarmName.length < 3}
                                className="w-full py-3 bg-orange text-white rounded-xl font-bold text-sm shadow-lg shadow-orange/20 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                                Schwarm erstellen
                            </button>
                        </div>
                    )}

                    {/* Join Form */}
                    {showJoin && (
                        <div className="p-6">
                            <button 
                                onClick={() => setShowJoin(false)}
                                className="text-sm text-gray-400 mb-4 hover:text-teal"
                            >
                                ← Zurück
                            </button>
                            <h3 className="font-bold text-teal text-lg mb-4">Schwarm beitreten</h3>
                            
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 mb-2">Einladungscode</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="z.B. ABC123"
                                    maxLength={8}
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm font-mono text-center text-lg tracking-widest focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 uppercase"
                                />
                            </div>
                            
                            <button
                                onClick={handleJoin}
                                disabled={loading || joinCode.length < 6}
                                className="w-full py-3 bg-teal text-white rounded-xl font-bold text-sm shadow-lg shadow-teal/20 hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                                Beitreten
                            </button>
                        </div>
                    )}

                    {/* Swarm Details */}
                    {swarm && (
                        <>
                            {/* Tabs */}
                            <div className="flex p-1 mx-4 mt-4 bg-gray-100 rounded-xl">
                                <button 
                                    onClick={() => setActiveTab('info')} 
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'info' ? 'bg-white text-teal shadow-sm' : 'text-gray-400'}`}
                                >
                                    <Users size={14} className="inline mr-1" /> Info
                                </button>
                                <button 
                                    onClick={() => setActiveTab('collection')} 
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'collection' ? 'bg-white text-teal shadow-sm' : 'text-gray-400'}`}
                                >
                                    <Trophy size={14} className="inline mr-1" /> Sammlung
                                </button>
                            </div>

                            {/* Info Tab */}
                            {activeTab === 'info' && (
                                <div className="p-4 space-y-4">
                                    {/* Swarm Name (editable for founder) */}
                                    <div className="bg-gray-50 rounded-2xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase">Schwarm-Name</span>
                                            {isFounder && !isEditing && (
                                                <button 
                                                    onClick={() => { setIsEditing(true); setEditName(swarm.name); }}
                                                    className="text-teal hover:text-teal-700"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    maxLength={50}
                                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal"
                                                />
                                                <button 
                                                    onClick={handleRename}
                                                    disabled={loading}
                                                    className="px-3 py-2 bg-teal text-white rounded-lg text-xs font-bold"
                                                >
                                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                </button>
                                                <button 
                                                    onClick={() => setIsEditing(false)}
                                                    className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="font-bold text-teal text-lg">{swarm.name}</div>
                                        )}
                                    </div>

                                    {/* Invite Section */}
                                    <div className="bg-orange/10 rounded-2xl p-4">
                                        <div className="text-xs font-bold text-orange uppercase mb-3">Freunde einladen</div>
                                        
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex-1 bg-white rounded-xl p-3 font-mono text-center text-lg tracking-widest text-teal font-bold border border-orange/20">
                                                {swarm.inviteCode}
                                            </div>
                                            <button
                                                onClick={copyCode}
                                                className="p-3 bg-white rounded-xl border border-orange/20 text-orange hover:bg-orange/10 transition-colors"
                                            >
                                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                        
                                        <button
                                            onClick={shareInvite}
                                            className="w-full py-3 bg-orange text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all active:scale-95"
                                        >
                                            <Link size={16} />
                                            {copiedLink ? 'Link kopiert!' : 'Einladungslink teilen'}
                                        </button>
                                        
                                        <p className="text-xs text-orange/70 text-center mt-2">
                                            birbz.de/s/{swarm.inviteCode}
                                        </p>
                                    </div>

                                    {/* Members */}
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-3">
                                            Mitglieder ({members.length}/{MAX_MEMBERS})
                                        </div>
                                        <div className="space-y-2">
                                            {loading ? (
                                                <div className="text-center py-4">
                                                    <Loader2 className="animate-spin mx-auto text-teal" />
                                                </div>
                                            ) : (
                                                members.map(member => (
                                                    <div 
                                                        key={member.id} 
                                                        className={`flex items-center gap-3 p-3 rounded-xl ${member.id === currentUser.id ? 'bg-orange/5' : 'bg-gray-50'}`}
                                                    >
                                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 relative">
                                                            <img src={getAvatarUrl(member.avatarSeed)} className="w-full h-full object-cover" />
                                                            {member.isFounder && (
                                                                <div className="absolute -top-1 -right-1 bg-orange text-white w-4 h-4 rounded-full flex items-center justify-center">
                                                                    <Crown size={10} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-sm text-teal">
                                                                {member.name} {member.id === currentUser.id && '(Du)'}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {member.collectedCount} Arten • {member.xp} XP
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Leave Button */}
                                    <button
                                        onClick={handleLeave}
                                        disabled={loading}
                                        className="w-full py-3 bg-red-50 text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                                    >
                                        <LogOut size={16} />
                                        Schwarm verlassen
                                    </button>
                                </div>
                            )}

                            {/* Collection Tab */}
                            {activeTab === 'collection' && (
                                <div className="p-4">
                                    {/* Progress */}
                                    <div className="bg-teal/10 rounded-2xl p-4 mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-teal uppercase">Schwarm-Fortschritt</span>
                                            <span className="font-mono text-sm font-bold text-teal">
                                                {swarmBirdIds.length}/{totalBirds}
                                            </span>
                                        </div>
                                        <div className="h-3 bg-white rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-teal to-orange transition-all duration-500"
                                                style={{ width: `${(swarmBirdIds.length / totalBirds) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-teal/70 mt-2 text-center">
                                            {totalBirds - swarmBirdIds.length} Arten fehlen noch!
                                        </p>
                                    </div>

                                    {/* Bird Grid Preview */}
                                    <div className="text-xs font-bold text-gray-400 uppercase mb-3">
                                        Gesammelte Arten ({swarmBirdIds.length})
                                    </div>
                                    
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <Loader2 className="animate-spin mx-auto text-teal" />
                                        </div>
                                    ) : swarmBirdIds.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <div className="text-4xl mb-2">🥚</div>
                                            <p className="text-sm">Noch keine Vögel gesammelt.</p>
                                            <p className="text-xs mt-1">Los geht's!</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-6 gap-2">
                                            {swarmBirdIds.slice(0, 30).map(birdId => {
                                                const bird = BIRDS_DB.find(b => b.id === birdId);
                                                return (
                                                    <div 
                                                        key={birdId}
                                                        className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-lg"
                                                        title={bird?.name}
                                                    >
                                                        🐦
                                                    </div>
                                                );
                                            })}
                                            {swarmBirdIds.length > 30 && (
                                                <div className="aspect-square bg-teal/10 rounded-lg flex items-center justify-center text-xs font-bold text-teal">
                                                    +{swarmBirdIds.length - 30}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
