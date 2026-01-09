"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"      // ✅ HalApp gibi default dark
      enableSystem={true}      // İstersen false yaparsın
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}