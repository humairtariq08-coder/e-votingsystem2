import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'AegisVote | Sovereign Enterprise & Biometric Voting Platform',
  description: 'Enterprise online voting platform with zero-knowledge identity decoupling, FIDO2 WebAuthn biometric security, and multi-tenant portal architecture.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
