import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"NEXUM", description:"Private personal knowledge and execution system.", manifest:"/manifest.webmanifest" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
