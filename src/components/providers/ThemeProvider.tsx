// src/components/providers/ThemeProvider.tsx
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

interface Props {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: Props) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme={theme}
      enableSystem={false}
    >
      {children}
    </NextThemeProvider>
  );
};
