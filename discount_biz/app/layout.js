import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SaverSpot - Discover & Save on Great Deals",
  description: "Find and save on the best offers from your favorite businesses",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CustomerAuthProvider>
            {children}
          </CustomerAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}