"use client"
import { createContext, ReactNode, useEffect, useState, useContext } from "react";
type theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({children}: {children: ReactNode}) {
    const [theme, setThemeState] = useState<theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    const getResolvedTheme = (currentTheme: theme): "light" | "dark" => {
        if (typeof window === "undefined") return "light";
        if(currentTheme === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return currentTheme;
    }

    // Load theme from localStorage on mount and set initial resolved theme
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as theme | null;
        const initialTheme = (savedTheme && ["light", "dark", "system"].includes(savedTheme)) 
            ? savedTheme 
            : "system";
        
        setThemeState(initialTheme);
        setResolvedTheme(getResolvedTheme(initialTheme));
        setMounted(true);
    }, []);

    // Update resolved theme when theme changes (after mount)
    useEffect(() => {
        if (!mounted) return;
        setResolvedTheme(getResolvedTheme(theme));
    }, [theme, mounted]);

    // Listen for system theme changes when using system mode
    useEffect(() => {
        if (!mounted || theme !== "system") return;
        
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            setResolvedTheme(getResolvedTheme("system"));
        }
        mediaQuery.addEventListener("change", handleChange);
        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        }
    }, [theme, mounted]);

    // Apply theme class to document
    useEffect(() => {
        if(!mounted) return;

        const root = document.documentElement;

        if(resolvedTheme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [resolvedTheme, mounted]);

    // Save theme function that persists to localStorage
    const setTheme = (newTheme: theme) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("theme", newTheme);
        }
        setThemeState(newTheme);
    }

    return(
        <ThemeContext.Provider value={{theme, resolvedTheme, setTheme}}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if(context === undefined){
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context;
}