// src/components/providers/ThemeProvider.tsx

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: Props) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      {children}
    </NextThemeProvider>
  );
};
