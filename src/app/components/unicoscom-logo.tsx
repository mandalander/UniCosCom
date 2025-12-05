'use client';

export function UniCosComLogo({ className = "h-8 w-8" }: { className?: string }) {
    return (
        <div className={`relative group cursor-pointer ${className}`}>
            <svg
                viewBox="0 0 120 120"
                className="w-full h-full transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* Animated gradient for U */}
                    <linearGradient id="gradientU" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }}>
                            <animate attributeName="stop-color" values="#06b6d4;#0ea5e9;#06b6d4" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="50%" style={{ stopColor: '#0ea5e9', stopOpacity: 1 }}>
                            <animate attributeName="stop-color" values="#0ea5e9;#3b82f6;#0ea5e9" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }}>
                            <animate attributeName="stop-color" values="#3b82f6;#2563eb;#3b82f6" dur="4s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>

                    {/* Animated gradient for C */}
                    <linearGradient id="gradientC" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#c026d3', stopOpacity: 1 }}>
                            <animate attributeName="stop-color" values="#c026d3;#a855f7;#c026d3" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="50%" style={{ stopColor: '#a855f7', stopOpacity: 1 }}>
                            <animate attributeName="stop-color" values="#a855f7;#9333ea;#a855f7" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }}>
                            <animate attributeName="stop-color" values="#7c3aed;#6366f1;#7c3aed" dur="4s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>

                    {/* Radial gradient for cosmic background */}
                    <radialGradient id="cosmicGlow" cx="50%" cy="50%">
                        <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.2 }} />
                        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                    </radialGradient>

                    {/* Advanced glow filter with multiple passes */}
                    <filter id="superGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                        <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur3" />
                        <feMerge>
                            <feMergeNode in="blur3" />
                            <feMergeNode in="blur2" />
                            <feMergeNode in="blur1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* 3D depth effect */}
                    <filter id="depth3D">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                        <feOffset dx="2" dy="2" result="offsetblur" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.5" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Shimmer effect */}
                    <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#fff', stopOpacity: 0 }} />
                        <stop offset="50%" style={{ stopColor: '#fff', stopOpacity: 0.6 }}>
                            <animate attributeName="offset" values="0;1;0" dur="3s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" style={{ stopColor: '#fff', stopOpacity: 0 }} />
                    </linearGradient>
                </defs>

                {/* Cosmic background glow */}
                <circle cx="60" cy="60" r="50" fill="url(#cosmicGlow)" className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Stardust particles */}
                <g className="opacity-40 group-hover:opacity-80 transition-opacity">
                    {[...Array(12)].map((_, i) => {
                        const angle = (i * 30) * Math.PI / 180;
                        const radius = 40 + (i % 3) * 8;
                        const cx = 60 + Math.cos(angle) * radius;
                        const cy = 60 + Math.sin(angle) * radius;
                        return (
                            <circle key={i} cx={cx} cy={cy} r="1" fill="#fff" opacity="0.6">
                                <animate
                                    attributeName="opacity"
                                    values="0.3;1;0.3"
                                    dur={`${2 + i * 0.2}s`}
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="r"
                                    values="0.8;1.5;0.8"
                                    dur={`${2 + i * 0.2}s`}
                                    repeatCount="indefinite"
                                />
                            </circle>
                        );
                    })}
                </g>

                {/* Rotating orbital rings */}
                <g className="transition-all duration-500">
                    <ellipse
                        cx="60"
                        cy="60"
                        rx="48"
                        ry="22"
                        fill="none"
                        stroke="url(#gradientU)"
                        strokeWidth="1.5"
                        opacity="0.4"
                        className="group-hover:opacity-70"
                        style={{ transformOrigin: '60px 60px' }}
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 60 60"
                            to="360 60 60"
                            dur="20s"
                            repeatCount="indefinite"
                        />
                    </ellipse>

                    <ellipse
                        cx="60"
                        cy="60"
                        rx="48"
                        ry="18"
                        fill="none"
                        stroke="url(#gradientC)"
                        strokeWidth="1.5"
                        opacity="0.3"
                        className="group-hover:opacity-60"
                        style={{ transformOrigin: '60px 60px' }}
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="60 60 60"
                            to="420 60 60"
                            dur="15s"
                            repeatCount="indefinite"
                        />
                    </ellipse>

                    <ellipse
                        cx="60"
                        cy="60"
                        rx="48"
                        ry="14"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1"
                        opacity="0.15"
                        className="group-hover:opacity-40"
                        style={{ transformOrigin: '60px 60px' }}
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="120 60 60"
                            to="-240 60 60"
                            dur="25s"
                            repeatCount="indefinite"
                        />
                    </ellipse>
                </g>

                {/* Letter U with 3D effect and shimmer */}
                <text
                    x="38"
                    y="75"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="52"
                    fontWeight="900"
                    fill="url(#gradientU)"
                    letterSpacing="-3"
                    filter="url(#depth3D)"
                    className="transition-all duration-300 group-hover:scale-105"
                >
                    U
                    <animate
                        attributeName="opacity"
                        values="1;0.85;1"
                        dur="3s"
                        repeatCount="indefinite"
                    />
                </text>

                {/* Shimmer overlay on U */}
                <text
                    x="38"
                    y="75"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="52"
                    fontWeight="900"
                    fill="url(#shimmer)"
                    letterSpacing="-3"
                    opacity="0.7"
                    className="group-hover:opacity-100 transition-opacity"
                >
                    U
                </text>

                {/* Letter C with 3D effect and shimmer */}
                <text
                    x="68"
                    y="75"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="52"
                    fontWeight="900"
                    fill="url(#gradientC)"
                    letterSpacing="-3"
                    filter="url(#depth3D)"
                    className="transition-all duration-300 group-hover:scale-105"
                >
                    C
                    <animate
                        attributeName="opacity"
                        values="1;0.85;1"
                        dur="3s"
                        begin="1.5s"
                        repeatCount="indefinite"
                    />
                </text>

                {/* Shimmer overlay on C */}
                <text
                    x="68"
                    y="75"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontSize="52"
                    fontWeight="900"
                    fill="url(#shimmer)"
                    letterSpacing="-3"
                    opacity="0.7"
                    className="group-hover:opacity-100 transition-opacity"
                >
                    C
                </text>

                {/* Orbiting planets with advanced glow */}
                <g filter="url(#superGlow)">
                    {/* Cyan planet */}
                    <circle r="3.5" fill="#06b6d4" className="group-hover:fill-[#22d3ee]">
                        <animateMotion
                            dur="8s"
                            repeatCount="indefinite"
                            path="M 20,60 A 40,16 0 1,1 100,60 A 40,16 0 1,1 20,60"
                        />
                        <animate
                            attributeName="r"
                            values="3;4.5;3"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>

                    {/* Purple planet */}
                    <circle r="3" fill="#a855f7" className="group-hover:fill-[#c026d3]">
                        <animateMotion
                            dur="10s"
                            repeatCount="indefinite"
                            path="M 100,60 A 40,16 0 1,0 20,60 A 40,16 0 1,0 100,60"
                        />
                        <animate
                            attributeName="r"
                            values="2.5;4;2.5"
                            dur="2.5s"
                            repeatCount="indefinite"
                        />
                    </circle>

                    {/* Blue planet */}
                    <circle r="2.5" fill="#3b82f6" className="group-hover:fill-[#60a5fa]">
                        <animateMotion
                            dur="12s"
                            repeatCount="indefinite"
                            path="M 60,35 A 42,20 0 1,1 60,85 A 42,20 0 1,1 60,35"
                        />
                        <animate
                            attributeName="r"
                            values="2;3.5;2"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </circle>

                    {/* Violet planet */}
                    <circle r="2.8" fill="#7c3aed" className="group-hover:fill-[#8b5cf6]">
                        <animateMotion
                            dur="14s"
                            repeatCount="indefinite"
                            path="M 60,85 A 42,20 0 1,0 60,35 A 42,20 0 1,0 60,85"
                        />
                        <animate
                            attributeName="r"
                            values="2.5;4;2.5"
                            dur="2.8s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </g>

                {/* Central energy core - appears on hover */}
                <circle
                    cx="60"
                    cy="60"
                    r="8"
                    fill="url(#gradientU)"
                    opacity="0"
                    className="group-hover:opacity-30 transition-all duration-500"
                    filter="url(#superGlow)"
                >
                    <animate
                        attributeName="r"
                        values="8;12;8"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </circle>
            </svg>
        </div>
    );
}
