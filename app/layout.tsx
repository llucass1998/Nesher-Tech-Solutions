import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nesher Tech Solutions | Central de chamados",
  description: "Acompanhe chamados, suporte técnico e indicadores da sua empresa.",
  icons: {
    icon: [
      { url: "/nesher-icon.png" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/nesher-icon.png"],
    apple: [
      { url: "/nesher-icon.png" },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <link rel="icon" type="image/png" href="/nesher-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
