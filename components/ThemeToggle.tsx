"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/themeContext";

type ThemeOption = {
    value: "light" | "dark" | "system";
    label: string;
};

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [dropdownOpen]);

    const themes: ThemeOption[] = [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "system", label: "System" },
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                aria-label="Theme selector"
            >
                Theme: {themes.find(t => t.value === theme)?.label || "System"}
            </button>
            
            {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden z-50 shadow-xl">
                    {themes.map((themeOption) => (
                        <button
                            key={themeOption.value}
                            onClick={() => {
                                setTheme(themeOption.value);
                                setDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                                theme === themeOption.value
                                    ? "bg-zinc-700 text-white"
                                    : "text-zinc-300 hover:bg-zinc-700 hover:text-white"
                            }`}
                        >
                            {themeOption.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ThemeToggle;