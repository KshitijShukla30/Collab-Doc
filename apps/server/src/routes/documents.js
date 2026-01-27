import express from 'express';
import { Document, memoryStore, isDBConnected } from '../db/models.js';

const router = express.Router();

// Helper to get user ID from request
const getUserId = (req) => {
    return req.query.userId || req.headers['x-user-id'] || 'anonymous';
};

// List documents for a specific user
router.get('/', async (req, res) => {
    const userId = getUserId(req);

    try {
        if (isDBConnected()) {
            const docs = await Document.find({ owner: userId }, {
                docId: 1,
                title: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1,
                isGuest: 1
            }).sort({ updatedAt: -1 }).limit(50);
            res.json(docs);
        } else {
            // In-memory fallback - filter by owner
            const docs = Array.from(memoryStore.values())
                .filter(d => d.owner === userId)
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 50);
            res.json(docs);
        }
    } catch (error) {
        console.error('Error listing documents:', error);
        res.status(500).json({ error: 'Failed to list documents' });
    }
});

// Get document metadata
router.get('/:docId', async (req, res) => {
    try {
        if (isDBConnected()) {
            const doc = await Document.findOne({ docId: req.params.docId }, {
                docId: 1,
                title: 1,
                owner: 1,
                collaborators: 1,
                createdAt: 1,
                updatedAt: 1
            });

            if (!doc) {
                return res.status(404).json({ error: 'Document not found' });
            }
            res.json(doc);
        } else {
            const doc = memoryStore.get(req.params.docId);
            if (!doc) {
                return res.status(404).json({ error: 'Document not found' });
            }
            res.json(doc);
        }
    } catch (error) {
        console.error('Error getting document:', error);
        res.status(500).json({ error: 'Failed to get document' });
    }
});

// Create new document
router.post('/', async (req, res) => {
    const userId = getUserId(req);

    try {
        const { title, isGuest } = req.body;
        const docId = 'doc-' + Math.random().toString(36).substring(2, 9);

        if (isDBConnected()) {
            const doc = new Document({
                docId,
                title: title || 'Untitled Document',
                owner: userId,
                isGuest: isGuest || false,
                expiresAt: isGuest ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
            });
            await doc.save();
            res.status(201).json(doc);
        } else {
            // In-memory fallback
            const doc = {
                docId,
                title: title || 'Untitled Document',
                owner: userId,
                isGuest: isGuest || false,
                expiresAt: isGuest ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            memoryStore.set(docId, doc);
            res.status(201).json(doc);
        }
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

// Update document title
router.patch('/:docId', async (req, res) => {
    try {
        const { title } = req.body;

        if (isDBConnected()) {
            const doc = await Document.findOneAndUpdate(
                { docId: req.params.docId },
                { title, updatedAt: new Date() },
                { new: true }
            );
            if (!doc) {
                return res.status(404).json({ error: 'Document not found' });
            }
            res.json(doc);
        } else {
            let doc = memoryStore.get(req.params.docId);
            if (!doc) {
                return res.status(404).json({ error: 'Document not found' });
            }
            doc.title = title;
            doc.updatedAt = new Date();
            memoryStore.set(req.params.docId, doc);
            res.json(doc);
        }
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ error: 'Failed to update document' });
    }
});

// Delete document
router.delete('/:docId', async (req, res) => {
    try {
        if (isDBConnected()) {
            await Document.deleteOne({ docId: req.params.docId });
        } else {
            memoryStore.delete(req.params.docId);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

export default router;
