'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

const colors = [
    '#958DF1', '#F98181', '#FBBC88', '#FAF594',
    '#70CFF8', '#94FADB', '#B9F18D', '#C3E2C2',
];

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

export default function Editor({ docName = 'default', userName = 'Anonymous' }) {
    const [status, setStatus] = useState('connecting');
    const [synced, setSynced] = useState(false);

    // Create Yjs document - stable across renders
    const ydoc = useMemo(() => new Y.Doc(), [docName]);

    // Create WebSocket provider
    const provider = useMemo(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';
        const wsProvider = new WebsocketProvider(wsUrl, docName, ydoc);

        wsProvider.on('status', ({ status }) => {
            setStatus(status);
        });

        wsProvider.on('synced', ({ synced }) => {
            setSynced(synced);
        });

        return wsProvider;
    }, [docName, ydoc]);

    // Create IndexedDB persistence for offline support
    const persistence = useMemo(() => {
        return new IndexeddbPersistence(docName, ydoc);
    }, [docName, ydoc]);

    // Stable user color
    const userColor = useMemo(() => getRandomColor(), []);

    // Configure TipTap editor
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                history: false, // Yjs handles history
            }),
            Collaboration.configure({
                document: ydoc,
            }),
            CollaborationCursor.configure({
                provider: provider,
                user: {
                    name: userName,
                    color: userColor,
                },
            }),
        ],
        editorProps: {
            attributes: {
                class: 'focus:outline-none min-h-full',
            },
        },
    });

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            provider.destroy();
            persistence.destroy();
            ydoc.destroy();
        };
    }, [provider, persistence, ydoc]);

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/30">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="font-medium text-white">{docName}</span>
                    <span className="text-gray-600">|</span>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' :
                                status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                    'bg-red-500'
                            }`} />
                        <span className="capitalize">{status}</span>
                    </div>
                    {synced && (
                        <>
                            <span className="text-gray-600">|</span>
                            <span className="text-green-400">Synced</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
                        style={{ backgroundColor: userColor }}
                    >
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-400">{userName}</span>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-3xl mx-auto">
                    <div className="min-h-[800px] bg-[#1a1a1a] border border-white/5 rounded-lg p-12 shadow-2xl">
                        <EditorContent
                            editor={editor}
                            className="prose prose-invert max-w-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
