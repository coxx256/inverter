import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UPS/Inverter Service Checklist | Job Card",
  description:
    "A responsive, print-ready UPS and inverter service checklist and job card.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
