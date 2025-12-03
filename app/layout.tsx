import type { Metadata } from "next";
import "./globals.css";
// Import vanilla-extract styles (order matters for layers)
import "@/styles/index";
import { ThemeProvider, ThemeScript } from "@/theme";
import { QueryProvider } from "@/providers";
import { AuthProvider } from "@/auth";

export const metadata: Metadata = {
  title: "Bit Trade",
  description: "Bit Trade Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          storageKey="theme"
        />
      </head>
      <body>
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="data-theme"
              defaultTheme="system"
              enableSystem
              storageKey="theme"
            >
              {children}
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
