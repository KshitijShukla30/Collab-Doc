'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { motion } from 'framer-motion';

const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const docId = params.docId;

    const [wsStatus, setWsStatus] = useState('connecting');
    const [title, setTitle] = useState('Loading...');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [collaborators, setCollaborators] = useState([]);

    const userName = session?.user?.name || 'Guest';

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Fetch document metadata
    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const res = await fetch(`${API_URL}/api/documents/${docId}`);
                if (res.ok) {
                    const doc = await res.json();
                    setTitle(doc.title);
                } else {
                    setTitle('Untitled Document');
                }
            } catch {
                setTitle('Untitled Document');
            }
        };
        fetchDoc();
    }, [docId]);

    // Save title
    const saveTitle = useCallback(async (newTitle) => {
        try {
            await fetch(`${API_URL}/api/documents/${docId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
        } catch (error) {
            console.error('Failed to save title:', error);
        }
    }, [docId]);

    // Yjs setup - create instances in useMemo, attach listeners in useEffect
    const ydoc = useMemo(() => new Y.Doc(), [docId]);
    const provider = useMemo(() => new WebsocketProvider(WS_URL, docId, ydoc), [docId, ydoc]);
    const persistence = useMemo(() => new IndexeddbPersistence(docId, ydoc), [docId, ydoc]);
    const userColor = useMemo(() => getRandomColor(), []);

    // Setup WebSocket status listener in useEffect (not useMemo)
    useEffect(() => {
        const handleStatus = ({ status }) => setWsStatus(status);
        provider.on('status', handleStatus);
        return () => provider.off('status', handleStatus);
    }, [provider]);

    // Track collaborators via awareness
    useEffect(() => {
        const updateCollaborators = () => {
            const states = provider.awareness.getStates();
            const users = [];
            states.forEach((state, clientId) => {
                if (state.user && clientId !== provider.awareness.clientID) {
                    users.push({ ...state.user, clientId });
                }
            });
            setCollaborators(users);
        };

        provider.awareness.on('update', updateCollaborators);
        return () => provider.awareness.off('update', updateCollaborators);
    }, [provider]);

    // Editor
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({ history: false }),
            Collaboration.configure({ document: ydoc }),
            CollaborationCursor.configure({
                provider,
                user: { name: userName, color: userColor }
            }),
        ],
        editorProps: {
            attributes: { class: 'focus:outline-none min-h-full' }
        },
    });

    // Cleanup
    useEffect(() => {
        return () => {
            provider.destroy();
            persistence.destroy();
            ydoc.destroy();
        };
    }, [provider, persistence, ydoc]);

    const handleTitleSubmit = () => {
        setIsEditingTitle(false);
        saveTitle(title);
    };

    const copyShareLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Toolbar buttons
    const ToolbarButton = ({ onClick, active, children, title }) => (
        <button
            onClick={onClick}
            className={`p-2 rounded-lg transition-colors ${active ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            title={title}
        >
            {children}
        </button>
    );

    if (status === 'loading') {
        return (
            <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#0a0a0a] text-white relative overflow-hidden">
            {/* Aurora Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-violet-600/10 via-blue-600/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-purple-600/10 via-pink-600/5 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                            className="bg-transparent border-b border-blue-500 focus:outline-none text-lg font-medium max-w-xs"
                            autoFocus
                        />
                    ) : (
                        <h1
                            onClick={() => setIsEditingTitle(true)}
                            className="text-lg font-medium cursor-pointer hover:text-blue-400 transition-colors truncate max-w-xs"
                            title="Click to edit"
                        >
                            {title}
                        </h1>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Collaborators */}
                    {collaborators.length > 0 && (
                        <div className="flex -space-x-2">
                            {collaborators.slice(0, 3).map((user) => (
                                <div
                                    key={user.clientId}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#0a0a0a]"
                                    style={{ backgroundColor: user.color }}
                                    title={user.name}
                                >
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            ))}
                            {collaborators.length > 3 && (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold border-2 border-[#0a0a0a]">
                                    +{collaborators.length - 3}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Connection Status */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500' :
                            wsStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                'bg-red-500'
                            }`} />
                        <span className="hidden sm:inline capitalize">{wsStatus}</span>
                    </div>

                    {/* Share Button */}
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                    </button>

                    {/* User Avatar */}
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black"
                        style={{ backgroundColor: userColor }}
                        title={userName}
                    >
                        {userName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="relative z-10 flex items-center gap-1 px-4 py-2 border-b border-white/5 bg-black/30">
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    active={editor?.isActive('bold')}
                    title="Bold"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                        <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                    </svg>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    active={editor?.isActive('italic')}
                    title="Italic"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M11 5h6M8 19h6M14 5l-4 14" />
                    </svg>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    active={editor?.isActive('strike')}
                    title="Strikethrough"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M16 4H9a3 3 0 000 6h6a3 3 0 010 6H8M4 12h16" />
                    </svg>
                </ToolbarButton>
                <div className="w-px h-5 bg-white/10 mx-2" />
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor?.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <span className="text-sm font-bold">H1</span>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor?.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <span className="text-sm font-bold">H2</span>
                </ToolbarButton>
                <div className="w-px h-5 bg-white/10 mx-2" />
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    active={editor?.isActive('bulletList')}
                    title="Bullet List"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    active={editor?.isActive('orderedList')}
                    title="Numbered List"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M4 14h1a1 1 0 110 2 1 1 0 010 2H4" />
                    </svg>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    active={editor?.isActive('blockquote')}
                    title="Quote"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
                    </svg>
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                    active={editor?.isActive('codeBlock')}
                    title="Code Block"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                </ToolbarButton>
            </div>

            {/* Editor */}
            <main className="relative z-10 flex-1 overflow-auto p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="min-h-[800px] bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/5 rounded-xl p-12 shadow-2xl">
                        <EditorContent
                            editor={editor}
                            className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-code:text-blue-400 prose-blockquote:border-blue-500"
                        />
                    </div>
                </div>
            </main>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
                    >
                        <h2 className="text-lg font-semibold mb-2">Share &quot;{title}&quot;</h2>
                        <p className="text-gray-500 text-sm mb-4">Anyone with the link can edit this document in real-time</p>

                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                readOnly
                                value={typeof window !== 'undefined' ? window.location.href : ''}
                                className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-gray-400 text-sm truncate"
                            />
                            <button
                                onClick={copyShareLink}
                                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${copied
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-blue-400 text-sm font-medium">Real-time collaboration</p>
                                    <p className="text-gray-500 text-xs mt-1">Changes sync instantly across all editors viewing this document</p>
                                </div>
                            </div>
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
            {/* Footer Attribution */}
            <div className="absolute bottom-4 right-4 z-50 text-xs text-white/20 select-none pointer-events-none">
                Made by Kshitij Shukla
            </div>
        </div>
    );
}
