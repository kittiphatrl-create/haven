import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haven — A Little Closer to Home",
  description:
    "Know what happened. Choose what happens next. An Alexa+ experience simulation with demo events and reviewed check-ins.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
