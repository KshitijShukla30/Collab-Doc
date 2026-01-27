import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

// Message types
const messageSync = 0;
const messageAwareness = 1;

// Store for active documents
const docs = new Map();

/**
 * Get or create a Yjs document
 */
function getYDoc(docName) {
    if (!docs.has(docName)) {
        const doc = new Y.Doc();
        doc.name = docName;
        docs.set(docName, {
            doc,
            conns: new Set(),
            awareness: new awarenessProtocol.Awareness(doc)
        });
        console.log(`Created new document: ${docName}`);
    }
    return docs.get(docName);
}

/**
 * Send message to a WebSocket connection
 */
function send(conn, message) {
    if (conn.readyState === 1) { // WebSocket.OPEN
        conn.send(message);
    }
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(conn, docData, message) {
    const { doc, awareness } = docData;
    const decoder = decoding.createDecoder(new Uint8Array(message));
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
        case messageSync: {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageSync);
            const syncMessageType = syncProtocol.readSyncMessage(
                decoder,
                encoder,
                doc,
                conn
            );
            if (encoding.length(encoder) > 1) {
                send(conn, encoding.toUint8Array(encoder));
            }
            break;
        }
        case messageAwareness: {
            awarenessProtocol.applyAwarenessUpdate(
                awareness,
                decoding.readVarUint8Array(decoder),
                conn
            );
            break;
        }
    }
}

/**
 * Setup WebSocket connection for a document
 */
export function setupWSConnection(conn, docName) {
    const docData = getYDoc(docName);
    const { doc, conns, awareness } = docData;

    // Add connection to document
    conns.add(conn);

    // Send initial sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    send(conn, encoding.toUint8Array(encoder));

    // Send awareness states
    const awarenessStates = awareness.getStates();
    if (awarenessStates.size > 0) {
        const awarenessEncoder = encoding.createEncoder();
        encoding.writeVarUint(awarenessEncoder, messageAwareness);
        encoding.writeVarUint8Array(
            awarenessEncoder,
            awarenessProtocol.encodeAwarenessUpdate(
                awareness,
                Array.from(awarenessStates.keys())
            )
        );
        send(conn, encoding.toUint8Array(awarenessEncoder));
    }

    // Handle document updates
    const updateHandler = (update, origin) => {
        if (origin !== conn) {
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageSync);
            syncProtocol.writeUpdate(encoder, update);

            // Broadcast to all connections except origin
            conns.forEach((connItem) => {
                if (connItem !== origin) {
                    send(connItem, encoding.toUint8Array(encoder));
                }
            });
        }
    };
    doc.on('update', updateHandler);

    // Handle awareness updates
    const awarenessHandler = ({ added, updated, removed }, origin) => {
        const changedClients = added.concat(updated, removed);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(
            encoder,
            awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
        );
        const message = encoding.toUint8Array(encoder);

        conns.forEach((connItem) => {
            send(connItem, message);
        });
    };
    awareness.on('update', awarenessHandler);

    // Handle incoming messages
    conn.on('message', (message) => {
        handleMessage(conn, docData, message);
    });

    // Handle connection close
    conn.on('close', () => {
        conns.delete(conn);
        awareness.setLocalState(null);
        doc.off('update', updateHandler);
        awareness.off('update', awarenessHandler);
        console.log(`Client disconnected from: ${docName} (${conns.size} remaining)`);

        // Clean up empty documents after a delay
        if (conns.size === 0) {
            setTimeout(() => {
                if (conns.size === 0) {
                    docs.delete(docName);
                    console.log(`Document cleaned up: ${docName}`);
                }
            }, 30000);
        }
    });

    // Handle errors
    conn.on('error', (error) => {
        console.error(`WebSocket error on ${docName}:`, error);
    });

    console.log(`Client connected to: ${docName} (${conns.size} total)`);
}
