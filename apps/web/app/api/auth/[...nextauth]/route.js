import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        // Guest login provider
        CredentialsProvider({
            name: 'Guest',
            credentials: {
                name: { label: 'Your Name', type: 'text', placeholder: 'Enter your name' }
            },
            async authorize(credentials) {
                const name = credentials?.name || 'Guest';
                return {
                    id: 'guest-' + Math.random().toString(36).substring(2, 9),
                    name: name,
                    email: null,
                    image: null,
                    isGuest: true
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.isGuest = user.isGuest || false;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub;
                session.user.isGuest = token.isGuest;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login'
    },
    secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
