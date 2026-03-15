import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    docId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        default: 'Untitled Document'
    },
    content: {
        type: Buffer,
        default: null
    },
    updates: [{
        type: Buffer
    }],
    owner: {
        type: String,
        required: true,
        index: true
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        default: null
    },
    collaborators: [{
        userId: String,
        role: {
            type: String,
            enum: ['viewer', 'editor', 'owner'],
            default: 'editor'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

documentSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// TTL index for auto-deleting expired guest docs
documentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Document = mongoose.model('Document', documentSchema);

// In-memory fallback store
export const memoryStore = new Map();

let dbConnected = false;

export function isDBConnected() {
    return dbConnected;
}

// Cleanup expired guest documents from memory
function cleanupExpiredDocs() {
    const now = new Date();
    for (const [docId, doc] of memoryStore.entries()) {
        if (doc.expiresAt && new Date(doc.expiresAt) < now) {
            memoryStore.delete(docId);
            console.log(`🗑️ Cleaned up expired guest document: ${docId}`);
        }
    }
}

// Run cleanup every hour
setInterval(cleanupExpiredDocs, 60 * 60 * 1000);

export async function connectDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri || uri === 'mongodb://localhost:27017/multiuser') {
        console.log('ℹ️  No MongoDB configured, using in-memory storage');
        console.log('   Guest documents expire after 24 hours');
        dbConnected = false;
        return;
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });

        await mongoose.connection.db.admin().ping();

        dbConnected = true;
        console.log('📦 Connected to MongoDB');
} catch (error) {
        console.warn('⚠️ MongoDB connection failed, using in-memory storage');
        dbConnected = false;
    }
}

// Get raw document content buffer from DB
export async function getDocumentContent(docId) {
    if (!isDBConnected()) {
        const doc = memoryStore.get(docId);
        return doc?.content || null;
    }

    try {
        const doc = await Document.findOne({ docId }, { content: 1 });
        return doc?.content || null;
    } catch (error) {
        console.error('Error fetching document content:', error);
        return null;
    }
}

// Save raw document content buffer to DB
export async function saveDocumentContent(docId, buffer) {
    if (!isDBConnected()) {
        const doc = memoryStore.get(docId);
        if (doc) {
            doc.content = buffer;
            doc.updatedAt = new Date();
            memoryStore.set(docId, doc);
        }
        return;
    }

    try {
        await Document.updateOne(
            { docId },
            { 
                content: buffer,
                updatedAt: new Date()
            }
        );
    } catch (error) {
        console.error('Error saving document content:', error);
    }
}
