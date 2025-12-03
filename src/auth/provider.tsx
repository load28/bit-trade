/**
 * 인증 프로바이더
 * NextAuth SessionProvider와 Jotai Provider 통합
 */

'use client';

import { type ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Provider as JotaiProvider } from 'jotai';

interface AuthProviderProps {
  children: ReactNode;
  /** NextAuth 세션 (서버에서 전달) */
  session?: Parameters<typeof SessionProvider>[0]['session'];
}

/**
 * 인증 프로바이더
 * 앱 루트에서 사용
 *
 * @example
 * // app/layout.tsx
 * import { AuthProvider } from '@/auth';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session}>
      <JotaiProvider>{children}</JotaiProvider>
    </SessionProvider>
  );
}
