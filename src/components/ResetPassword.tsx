// src/components/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ResetPasswordProps {
    onComplete: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [sessionError, setSessionError] = useState<string | null>(null);

    // Supabase verarbeitet den Token aus der URL automatisch
    useEffect(() => {
        const checkSession = async () => {
            // Kurz warten, damit Supabase den Token verarbeiten kann
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Session error:', error);
                setSessionError('Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.');
                return;
            }
            
            if (session) {
                setSessionReady(true);
            } else {
                // Prüfe ob ein Fehler in der URL ist
                const hash = window.location.hash;
                const params = new URLSearchParams(hash.replace('#', ''));
                const errorCode = params.get('error_code');
                
                if (errorCode === 'otp_expired') {
                    setSessionError('Der Link ist abgelaufen. Bitte fordere einen neuen an.');
                } else if (params.get('error')) {
                    setSessionError('Der Link ist ungültig. Bitte fordere einen neuen an.');
                } else {
                    setSessionError('Keine gültige Session gefunden. Bitte fordere einen neuen Link an.');
                }
            }
        };
        
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('Das Passwort muss mindestens 6 Zeichen haben.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Die Passwörter stimmen nicht überein.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            setSuccess(true);
            
            // Nach 2 Sekunden zur App weiterleiten
            setTimeout(() => {
                // URL aufräumen
                window.history.replaceState({}, '', '/');
                onComplete();
            }, 2000);
            
        } catch (err: any) {
            console.error('Password update error:', err);
            setError(err.message || 'Ein Fehler ist aufgetreten.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        window.history.replaceState({}, '', '/');
        onComplete();
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
                
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-teal rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🐦</span>
                    </div>
                    <h1 className="text-2xl font-bold text-teal">BirdNerd</h1>
                </div>

                {/* Session Error State */}
                {sessionError && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="text-red-500" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Link ungültig</h2>
                        <p className="text-gray-500 mb-6">{sessionError}</p>
                        <button
                            onClick={handleBackToLogin}
                            className="w-full py-4 bg-teal text-white rounded-2xl font-bold hover:bg-teal-800 transition-colors"
                        >
                            Zurück zum Login
                        </button>
                    </div>
                )}

                {/* Loading Session */}
                {!sessionError && !sessionReady && (
                    <div className="text-center py-8">
                        <Loader2 className="animate-spin text-teal mx-auto mb-4" size={40} />
                        <p className="text-gray-500">Link wird überprüft...</p>
                    </div>
                )}

                {/* Success State */}
                {success && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-500" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Passwort geändert!</h2>
                        <p className="text-gray-500">Du wirst weitergeleitet...</p>
                    </div>
                )}

                {/* Password Form */}
                {sessionReady && !success && (
                    <>
                        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Neues Passwort</h2>
                        <p className="text-gray-500 text-center mb-6">Wähle ein neues Passwort für dein Konto.</p>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4 border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="Neues Passwort"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="Passwort bestätigen"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !password || !confirmPassword}
                                className="w-full py-4 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20 flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Passwort speichern'}
                            </button>
                        </form>

                        <button
                            onClick={handleBackToLogin}
                            className="w-full text-gray-400 hover:text-teal text-sm mt-4"
                        >
                            Abbrechen
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
