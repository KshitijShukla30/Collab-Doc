'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [guestName, setGuestName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = () => {
        setIsLoading(true);
        signIn('google', { callbackUrl: '/' });
    };

    const handleGuestLogin = () => {
        if (!guestName.trim()) return;
        setIsLoading(true);
        signIn('credentials', {
            name: guestName,
            callbackUrl: '/'
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 overflow-hidden relative">
            {/* Aurora Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-violet-600/30 via-blue-600/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-purple-600/30 via-pink-600/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-gradient-to-bl from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {/* ... existing content ... */}
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Collaborative Editor
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Real-time document collaboration
                        </p>
                    </div>

                    {/* Google Login */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-gray-500 text-sm">or</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {/* Guest Login */}
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
                            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-500"
                        />
                        <button
                            onClick={handleGuestLogin}
                            disabled={isLoading || !guestName.trim()}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            Continue as Guest
                        </button>
                    </div>

                    <p className="text-center text-gray-600 text-xs mt-6">
                        Guest sessions are temporary. Sign in with Google for persistent access.
                    </p>
                </div>

                {/* Footer Attribution */}
                <div className="text-center mt-8 text-gray-500 text-sm font-light opacity-50 hover:opacity-100 transition-opacity">
                    Made by <span className="font-medium text-gray-400">Kshitij Shukla</span>
                </div>
            </motion.div>
        </div>
    );
}
