import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { brand } from "@/config/brand";
import SmoothScroll from "@/components/providers/SmoothScroll";
import FassLoader from "@/components/loader/FassLoader";

/**
 * Runs before first paint: hides the server-rendered black loader cover for
 * repeat visits in a session and for reduced-motion users (?loader=1 forces it,
 * ?loader=0 skips it). Must stay in sync with shouldPlay() in FassLoader.
 */
const LOADER_GATE = `(function(){try{var q=new URLSearchParams(location.search).get("loader");var seen=sessionStorage.getItem("fass:loader:v1")==="1";var rm=matchMedia("(prefers-reduced-motion: reduce)").matches;var off=q==="0"||(q!=="1"&&(seen||rm));document.documentElement.setAttribute("data-loader",off?"off":"on");}catch(e){document.documentElement.setAttribute("data-loader","off");}})();`;

export const metadata: Metadata = {
  title: `${brand.prefix} ${brand.name} — Fine Gemstone Jewellery`,
  description: brand.description,
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#070908",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOADER_GATE }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-champagne focus:px-4 focus:py-3 focus:text-eyebrow focus:uppercase focus:text-obsidian"
        >
          Skip to content
        </a>
        <FassLoader />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
