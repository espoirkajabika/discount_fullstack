// app/layout.js - Update your existing layout file
import { Geist, Geist_Mono } from "next/font/google"; // FIXED: changed from "next/font/next"
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui/SimpleToast' 
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Discount Deals",
  description: "Discover amazing deals from local businesses",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            /* Loading spinner styles */
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 4px solid #f3f4f6;
              border-top: 4px solid #8E0D3C;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            
            .loading-container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #f9fafb;
            }
          `
        }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}