'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewDocModal, setShowNewDocModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [docToDelete, setDocToDelete] = useState(null);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [copied, setCopied] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    // Get user identifier
    const userId = session?.user?.id || session?.user?.email || session?.user?.name || 'anonymous';
    const isGuest = session?.user?.isGuest || false;

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Fetch documents for this user
    useEffect(() => {
        if (status === 'authenticated' && userId) {
            fetchDocuments();
        }
    }, [status, userId]);

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`${API_URL}/api/documents?userId=${encodeURIComponent(userId)}`);
            if (res.ok) {
                const docs = await res.json();
                setDocuments(docs);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const createDocument = async () => {
        try {
            const res = await fetch(`${API_URL}/api/documents?userId=${encodeURIComponent(userId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newDocTitle || 'Untitled Document',
                    isGuest
                })
            });

            if (res.ok) {
                const doc = await res.json();
                router.push(`/editor/${doc.docId}`);
            }
        } catch (error) {
            console.error('Failed to create document:', error);
        }
    };

    // Open delete confirmation modal
    const openDeleteModal = (doc, e) => {
        e.stopPropagation();
        setDocToDelete(doc);
        setShowDeleteModal(true);
    };

    // Confirm and execute delete
    const confirmDelete = async () => {
        if (!docToDelete) return;

        setDeleting(true);
        try {
            const res = await fetch(`${API_URL}/api/documents/${docToDelete.docId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setDocuments(docs => docs.filter(d => d.docId !== docToDelete.docId));
                setShowDeleteModal(false);
                setDocToDelete(null);
            } else {
                console.error('Delete failed:', res.statusText);
            }
        } catch (error) {
            console.error('Failed to delete document:', error);
        } finally {
            setDeleting(false);
        }
    };

    const openShareModal = (doc, e) => {
        e.stopPropagation();
        setSelectedDoc(doc);
        setShowShareModal(true);
    };

    const copyShareLink = () => {
        const link = `${window.location.origin}/editor/${selectedDoc.docId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (status === 'loading' || status === 'unauthenticated') {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
            {/* Aurora Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-violet-600/20 via-blue-600/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-purple-600/20 via-pink-600/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Collaborative Editor
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowNewDocModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium">{session?.user?.name}</p>
                                <p className="text-xs text-gray-500">
                                    {isGuest ? (
                                        <span className="text-yellow-500">Guest • 24hr session</span>
                                    ) : (
                                        session?.user?.email
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                                title="Sign out"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Guest Warning Banner */}
            {isGuest && (
                <div className="relative z-10 bg-yellow-500/10 border-b border-yellow-500/20">
                    <div className="max-w-6xl mx-auto px-6 py-2 flex items-center gap-2 text-yellow-500 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Guest documents expire after 24 hours. Sign in with Google for permanent storage.
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
                <h2 className="text-lg font-medium text-gray-400 mb-6">Your Documents</h2>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : documents.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium mb-2">No documents yet</h3>
                        <p className="text-gray-500 mb-6">Create your first document to get started</p>
                        <button
                            onClick={() => setShowNewDocModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Document
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc, i) => (
                            <motion.div
                                key={doc.docId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => router.push(`/editor/${doc.docId}`)}
                                className="group p-5 bg-[#111]/80 backdrop-blur-sm border border-white/5 rounded-xl hover:border-blue-500/30 hover:bg-[#151515] transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => openShareModal(doc, e)}
                                            className="p-2 rounded-lg hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 transition-all"
                                            title="Share"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => openDeleteModal(doc, e)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-medium text-white mb-1 truncate">{doc.title}</h3>
                                <p className="text-sm text-gray-500">{formatDate(doc.updatedAt)}</p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* New Document Modal */}
            {showNewDocModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
                    >
                        <h2 className="text-lg font-semibold mb-4">Create New Document</h2>
                        <input
                            type="text"
                            placeholder="Document title..."
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createDocument()}
                            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors mb-4"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowNewDocModal(false); setNewDocTitle(''); }}
                                className="flex-1 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createDocument}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                Create
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && selectedDoc && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
                    >
                        <h2 className="text-lg font-semibold mb-2">Share Document</h2>
                        <p className="text-gray-500 text-sm mb-4">Anyone with the link can edit this document</p>

                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                readOnly
                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/editor/${selectedDoc.docId}`}
                                className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-gray-400 text-sm truncate"
                            />
                            <button
                                onClick={copyShareLink}
                                className={`px-4 py-3 rounded-lg font-medium transition-all ${copied
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                    }`}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        <button
                            onClick={() => setShowShareModal(false)}
                            className="w-full px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            Done
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && docToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold">Delete Document?</h2>
                        </div>

                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete <span className="text-white font-medium">"{docToDelete.title}"</span>? This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDocToDelete(null); }}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
