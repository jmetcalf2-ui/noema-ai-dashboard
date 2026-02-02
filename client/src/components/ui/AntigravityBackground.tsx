import React, { useRef } from "react";

// Renamed locally to match file, but functionally this is now a "Clean" background
export function AntigravityBackground({ children }: { children: React.ReactNode }) {
    // Minimal "Clean AI" background

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
            {/* Subtle Mesh Gradient for Depth - Very High Key (White/Gray) */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-50/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-50/30 rounded-full blur-[100px]" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
