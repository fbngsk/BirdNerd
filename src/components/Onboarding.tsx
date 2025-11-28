import React, { useState } from 'react';
import { Bird, ArrowRight, User, Mail, Lock, Loader2, Ghost } from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { getAvatarUrl } from '../services/birdService';

interface OnboardingProps {
    onComplete: (profile: UserProfile) => void;
}

// Bird-themed seeds
const AVATAR_SEEDS = ['Falke', 'Adler', 'Spatz', 'Meise', 'Eule', 'Rabe', 'Specht', 'Ente', 'Schwan', 'Reiher'];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [isLogin, setIsLogin] = useState(false); // Toggle between Login and Register
    const [isResetPassword, setIsResetPassword] = useState(false); // Password reset mode
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [region, setRegion] = useState('');
    const [selectedSeed, setSelectedSeed] = useState(AVATAR_SEEDS[0]);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSuccessMessage('Falls ein Konto mit dieser E-Mail existiert, erhältst du einen Link zum Zurücksetzen.');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ein Fehler ist aufgetreten.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Registrierung fehlgeschlagen");

            // 2. Create Profile in DB
            const newProfile = {
                id: authData.user.id,
                email: email,
                name: name,
                avatar_seed: selectedSeed,
                home_region: region || 'Deutschland',
                xp: 0,
                collected_ids: [],
                badges: [],
                current_streak: 0,
                longest_streak: 0,
                last_log_date: ''
            };

            const { error: dbError } = await supabase
                .from('profiles')
                .insert([newProfile]);

            if (dbError) throw dbError;

            // 3. Convert to local type and finish
            onComplete({
                name: newProfile.name,
                avatarSeed: newProfile.avatar_seed,
                homeRegion: newProfile.home_region,
                badges: [],
                friends: [],
                currentStreak: 0,
                longestStreak: 0,
                lastLogDate: ''
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ein Fehler ist aufgetreten.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign In
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Login fehlgeschlagen");

            // 2. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw profileError;

            // 3. Finish
            onComplete({
                name: profileData.name,
                avatarSeed: profileData.avatar_seed,
                homeRegion: profileData.home_region,
                badges: profileData.badges || [],
                friends: profileData.friends || [],
                currentStreak: profileData.current_streak || 0,
                longestStreak: profileData.longest_streak || 0,
                lastLogDate: profileData.last_log_date || ''
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ein Fehler ist aufgetreten.");
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = () => {
        onComplete({
            name: 'Gast',
            avatarSeed: 'Spatz',
            homeRegion: 'Demo-Modus',
            badges: [],
            friends: [],
            currentStreak: 0,
            longestStreak: 0,
            lastLogDate: ''
        });
    };

    return (
        <div className="fixed inset-0 bg-cream z-50 flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center my-auto">
                <div className="w-20 h-20 bg-teal rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                    <Bird size={40} />
                </div>
                
                <h2 className="text-2xl font-bold text-teal mb-2">
                    {isResetPassword ? 'Passwort zurücksetzen' : isLogin ? 'Willkommen zurück!' : 'Neu bei Birbz?'}
                </h2>
                <p className="text-gray-500 mb-8 text-sm">
                    {isResetPassword 
                        ? 'Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.'
                        : isLogin 
                            ? 'Melde dich an, um deine Sammlung zu laden.' 
                            : 'Erstelle ein Konto, um deine Entdeckungen zu speichern.'}
                </p>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-6 border border-red-100">
                        {error}
                    </div>
                )}
                
                {successMessage && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm mb-6 border border-green-100">
                        {successMessage}
                    </div>
                )}

                {/* Password Reset Form */}
                {isResetPassword ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                required
                                placeholder="E-Mail Adresse"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                            />
                        </div>
                        
                        <button 
                            onClick={handlePasswordReset}
                            disabled={loading || !email}
                            className="w-full py-4 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20 flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Link senden'}
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => { setIsResetPassword(false); setError(null); setSuccessMessage(null); }}
                            className="text-sm text-gray-500 hover:text-teal mt-2"
                        >
                            ← Zurück zum Login
                        </button>
                    </div>
                ) : (
                <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                    
                    {/* Registration Only: Avatar & Name */}
                    {!isLogin && (
                        <>
                            <div className="flex overflow-x-auto gap-3 pb-2 px-1 no-scrollbar justify-center">
                                {AVATAR_SEEDS.map(seed => (
                                    <button
                                        key={seed}
                                        type="button"
                                        onClick={() => setSelectedSeed(seed)}
                                        className={`w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 transition-all ${selectedSeed === seed ? 'border-teal scale-110' : 'border-transparent opacity-50'}`}
                                    >
                                        <img src={getAvatarUrl(seed)} alt={seed} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Benutzername"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                                />
                            </div>
                        </>
                    )}

                    {/* Common Fields */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="email" 
                            required
                            placeholder="E-Mail Adresse"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            required
                            minLength={6}
                            placeholder="Passwort (min. 6 Zeichen)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                        />
                    </div>
                    
                    {isLogin && (
                        <button 
                            type="button"
                            onClick={() => { setIsResetPassword(true); setError(null); setSuccessMessage(null); }}
                            className="text-sm text-gray-400 hover:text-teal text-right w-full -mt-2"
                        >
                            Passwort vergessen?
                        </button>
                    )}

                    {!isLogin && (
                        <input 
                            type="text" 
                            placeholder="Region (z.B. Berlin)"
                            value={region}
                            onChange={e => setRegion(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 text-center"
                        />
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20 flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Anmelden' : 'Konto erstellen')}
                    </button>
                </form>
                )}

                {!isResetPassword && (
                <>
                <div className="mt-6 text-sm text-gray-500">
                    {isLogin ? 'Noch kein Konto? ' : 'Bereits registriert? '}
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="font-bold text-teal hover:underline"
                    >
                        {isLogin ? 'Jetzt registrieren' : 'Hier anmelden'}
                    </button>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <button 
                        onClick={handleGuestLogin}
                        className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        <Ghost size={16} />
                        Gastzugang (Demo)
                    </button>
                </div>
                </>
                )}
            </div>
        </div>
    );
};
