import React, { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function AntigravityBackground({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 1000], [0, 300]);
    const y2 = useTransform(scrollY, [0, 1000], [0, -200]);

    // Particle System
    const particles = React.useMemo(() => {
        return Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 20 + 10,
            delay: Math.random() * 5,
        }));
    }, []);

    return (
        <div ref={containerRef} className="relative min-h-screen w-full overflow-hidden bg-background text-foreground selection:bg-primary/30">
            {/* Background Mesh Gradients */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px] animate-float" />
            </div>

            {/* Floating Particles */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="absolute rounded-full bg-white/10"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: p.size,
                            height: p.size,
                        }}
                        animate={{
                            y: [0, -100, 0],
                            opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: p.delay,
                        }}
                    />
                ))}
            </div>

            {/* Glass Overlay for Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
