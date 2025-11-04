import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { ThemeProvider } from "@mui/material";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { Roboto } from "next/font/google";
import { theme } from "@/lib/theme";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={roboto.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <RootProvider>{children}</RootProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
