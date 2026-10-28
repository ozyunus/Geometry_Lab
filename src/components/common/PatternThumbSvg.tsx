import React from 'react';

interface PatternThumbSvgProps {
  type: 'seljuk8' | 'kumiko6' | 'andalusian12' | 'moroccan16' | 'persianGirih' | 'modernHex';
  className?: string;
}

export const PatternThumbSvg: React.FC<PatternThumbSvgProps> = ({ type, className = 'w-full h-full' }) => {
  const strokeColor = '#087D86';
  const amberColor = '#D89A43';
  const paleTeal = '#DCEDED';

  switch (type) {
    case 'seljuk8':
      return (
        <svg viewBox="-100 -100 200 200" className={className}>
          <rect x="-65" y="-65" width="130" height="130" fill="none" stroke={strokeColor} strokeWidth="3" opacity="0.4" />
          <rect x="-65" y="-65" width="130" height="130" transform="rotate(45)" fill="none" stroke={strokeColor} strokeWidth="3" opacity="0.4" />
          {/* Star Silhouette */}
          <polygon
            points="0,-85 24,-24 85,0 24,24 0,85 -24,24 -85,0 -24,-24"
            fill="rgba(8, 125, 134, 0.12)"
            stroke={strokeColor}
            strokeWidth="3.5"
          />
          <circle cx="0" cy="0" r="85" fill="none" stroke={amberColor} strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="0" cy="0" r="3" fill={amberColor} />
        </svg>
      );

    case 'kumiko6':
      return (
        <svg viewBox="-100 -100 200 200" className={className}>
          {/* Outer hexagon */}
          <polygon
            points="0,-80 69.28,-40 69.28,40 0,80 -69.28,40 -69.28,-40"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
          />
          {/* Radiating 6 axes */}
          {[0, 60, 120, 180, 240, 300].map(deg => {
            const rad = (deg * Math.PI) / 180;
            const x = 80 * Math.sin(rad);
            const y = -80 * Math.cos(rad);
            return <line key={deg} x1="0" y1="0" x2={x} y2={y} stroke={strokeColor} strokeWidth="2.5" />;
          })}
          {/* Asanoha internal star struts */}
          {[0, 60, 120, 180, 240, 300].map(deg => {
            return (
              <g key={`leaf-${deg}`} transform={`rotate(${deg})`}>
                <line x1="0" y1="-80" x2="34.64" y2="-20" stroke={amberColor} strokeWidth="2" />
                <line x1="0" y1="-80" x2="-34.64" y2="-20" stroke={amberColor} strokeWidth="2" />
                <line x1="0" y1="0" x2="0" y2="-80" stroke={strokeColor} strokeWidth="2" />
              </g>
            );
          })}
          <circle cx="0" cy="0" r="4" fill={amberColor} />
        </svg>
      );

    case 'andalusian12':
      return (
        <svg viewBox="-100 -100 200 200" className={className}>
          {/* 3 interleaved squares to form 12-gon structure */}
          <rect x="-60" y="-60" width="120" height="120" fill="none" stroke={strokeColor} strokeWidth="2" opacity="0.3" />
          <rect x="-60" y="-60" width="120" height="120" transform="rotate(30)" fill="none" stroke={strokeColor} strokeWidth="2" opacity="0.3" />
          <rect x="-60" y="-60" width="120" height="120" transform="rotate(60)" fill="none" stroke={strokeColor} strokeWidth="2" opacity="0.3" />
          {/* 12-point star */}
          <polygon
            points={Array.from({ length: 24 }).map((_, i) => {
              const r = i % 2 === 0 ? 82 : 48;
              const angle = (i * 15 - 90) * (Math.PI / 180);
              return `${(r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`;
            }).join(' ')}
            fill="rgba(216, 154, 67, 0.12)"
            stroke={amberColor}
            strokeWidth="3"
          />
          <circle cx="0" cy="0" r="28" fill="none" stroke={strokeColor} strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="0" cy="0" r="3" fill={strokeColor} />
        </svg>
      );

    case 'moroccan16':
      return (
        <svg viewBox="-100 -100 200 200" className={className}>
          {/* 16-point star medallion */}
          <polygon
            points={Array.from({ length: 32 }).map((_, i) => {
              const r = i % 2 === 0 ? 85 : 56;
              const angle = (i * 11.25 - 90) * (Math.PI / 180);
              return `${(r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`;
            }).join(' ')}
            fill="rgba(8, 125, 134, 0.15)"
            stroke={strokeColor}
            strokeWidth="2.5"
          />
          {/* Central 8-star accent */}
          <polygon
            points={Array.from({ length: 16 }).map((_, i) => {
              const r = i % 2 === 0 ? 36 : 22;
              const angle = (i * 22.5 - 90) * (Math.PI / 180);
              return `${(r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`;
            }).join(' ')}
            fill="rgba(216, 154, 67, 0.3)"
            stroke={amberColor}
            strokeWidth="2"
          />
          <circle cx="0" cy="0" r="85" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        </svg>
      );

    case 'persianGirih':
      return (
        <svg viewBox="-100 -100 200 200" className={className}>
          {/* 10-point decagonal girih star */}
          <polygon
            points={Array.from({ length: 20 }).map((_, i) => {
              const r = i % 2 === 0 ? 84 : 46;
              const angle = (i * 18 - 90) * (Math.PI / 180);
              return `${(r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`;
            }).join(' ')}
            fill="rgba(8, 100, 108, 0.14)"
            stroke={strokeColor}
            strokeWidth="3"
          />
          {/* Decagonal ribbon guide */}
          <polygon
            points={Array.from({ length: 10 }).map((_, i) => {
              const r = 84;
              const angle = (i * 36 - 90) * (Math.PI / 180);
              return `${(r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke={amberColor}
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <circle cx="0" cy="0" r="3" fill={amberColor} />
        </svg>
      );

    case 'modernHex':
      return (
        <svg viewBox="-100 -100 200 200" className={className}>
          {/* Central hexagon */}
          <polygon
            points="0,-40 34.64,-20 34.64,20 0,40 -34.64,20 -34.64,-20"
            fill="rgba(8, 125, 134, 0.15)"
            stroke={strokeColor}
            strokeWidth="2.5"
          />
          {/* Surrounding 6 hexagons */}
          {[0, 60, 120, 180, 240, 300].map(deg => {
            const rad = (deg * Math.PI) / 180;
            const cx = 60 * Math.sin(rad);
            const cy = -60 * Math.cos(rad);
            return (
              <g key={deg} transform={`translate(${cx}, ${cy})`}>
                <polygon
                  points="0,-35 30.31,-17.5 30.31,17.5 0,35 -30.31,17.5 -30.31,-17.5"
                  fill="none"
                  stroke={amberColor}
                  strokeWidth="2"
                  opacity="0.8"
                />
              </g>
            );
          })}
        </svg>
      );
  }
};
