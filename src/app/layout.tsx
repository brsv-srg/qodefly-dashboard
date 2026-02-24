import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qodefly - Build Fast. Deploy Faster.",
  description:
    "AI-powered hosting platform for everyone. Describe your project, AI builds it, one-click deploy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
