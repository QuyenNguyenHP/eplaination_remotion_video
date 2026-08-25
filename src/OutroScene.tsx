import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const OUTRO_FRAMES = 60;

export const OutroScene = ({
  logo = 'logo/logo.png',
  logoScale = 1,
  accent = '#f44911',
  accentEnd = '#0991df',
}: {
  logo?: string;
  logoScale?: number;
  accent?: string;
  accentEnd?: string;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const isMina = logo === 'logo/mina.png';
  const scale = spring({frame, fps, config: {damping: 15}});
  const opacity = interpolate(frame, [0, 12, 48, 60], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 25% 40%,#f4491140,transparent 48%),radial-gradient(circle at 75% 55%,#0991df40,transparent 48%),#061022',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial',
        color: 'white',
      }}
    >
      <div style={{opacity, textAlign: 'center'}}>
        {logo && (
          <Img
            src={staticFile(logo)}
            style={{
              width: 430 * logoScale,
              height: 430 * logoScale,
              objectFit: 'contain',
              transform: `scale(${scale})`,
              borderRadius: 28,
            }}
          />
        )}
        {isMina && (
          <div
            style={{
              margin: '22px 0 16px',
              fontSize: 46,
              fontWeight: 800,
              letterSpacing: 4,
              color: accentEnd,
              textShadow: `0 0 24px ${accent}66`,
            }}
          >
            CÔ MER NGÀNH MAY
          </div>
        )}
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: 3,
            background: `linear-gradient(90deg,${accent},${accentEnd})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          THANKS FOR WATCHING
        </div>
      </div>
    </AbsoluteFill>
  );
};
