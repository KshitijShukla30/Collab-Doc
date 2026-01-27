import './globals.css';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
    title: 'Collaborative Editor',
    description: 'Real-time collaborative document editor',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
