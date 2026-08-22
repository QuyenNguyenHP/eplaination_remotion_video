import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {OUTRO_FRAMES, OutroScene} from './OutroScene';
import {SoundWave} from './SoundWave';
import type {Episode, Scene} from './types';

const FPS = 30;
const DEFAULT_SCENE_SECONDS = 4;
const MIN_SCENE_SECONDS = 3;
const SCENE_TAIL_SECONDS = 0.65;
const CAPTION_WORDS_PER_CHUNK = 6;

// Fixed layout. Edit these values to reposition the logo or soundwave.
const LOGO_LAYOUT = {x: 50, y: 80, width: 920, opacity: 0.12};
const SOUNDWAVE_LAYOUT = {x: 50, y: 80};

const BRAND_A = '#f44911';
const BRAND_B = '#0991df';

const fallbackSymbols: Record<string, string> = {
  hook: 'M',
  definition: 'PLC ↔ HMI ↔ SENSOR',
  purpose: 'DEVICE · DATA · DEVICE',
  mechanism: 'REQUEST  →  RESPONSE',
  example: '40001  →  1450 RPM',
  'real-use': 'PLC · METER · BMS',
  variants: 'RTU  /  TCP',
  payoff: 'ONE SHARED LANGUAGE',
};

const defaultCharacters: Record<string, string> = {
  hook: 'Speaking1.png',
  definition: 'pointing left1.png',
  purpose: 'Speaking2.png',
  mechanism: 'pointing right1.png',
  example: 'pointing left2.png',
  'real-use': 'Speaking3.png',
  variants: 'questioning2.png',
  payoff: 'Speaking1.png',
};

export const getSceneDuration = (scene: Scene) =>
  Math.ceil(
    Math.max(
      MIN_SCENE_SECONDS,
      scene.audioDuration
        ? scene.audioDuration + SCENE_TAIL_SECONDS
        : DEFAULT_SCENE_SECONDS,
    ) * FPS,
  );

export const getDuration = (episode: Episode) =>
  episode.scenes.reduce((total, scene) => total + getSceneDuration(scene), 0) +
  OUTRO_FRAMES;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Caption = ({
  text,
  durationInFrames,
  speechDurationInFrames,
  accent,
  accentEnd,
}: {
  text: string;
  durationInFrames: number;
  speechDurationInFrames: number;
  accent: string;
  accentEnd: string;
}) => {
  const frame = useCurrentFrame();
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const speechEnd = Math.max(
    1,
    Math.min(speechDurationInFrames - 1, durationInFrames - 1),
  );
  const captionDelayFrames = Math.min(5, Math.floor(speechEnd * 0.08));
  const wordWeights = words.map((word) => {
    const letters = word.replace(/[^\p{L}\p{N}]/gu, '').length;
    const punctuationPause = /[.!?…]$/.test(word)
      ? 0.85
      : /[,;:]$/.test(word)
        ? 0.42
        : 0;
    return 1 + Math.min(0.45, letters * 0.035) + punctuationPause;
  });
  const cumulativeWeights = wordWeights.reduce<number[]>((totals, weight) => {
    totals.push((totals.at(-1) ?? 0) + weight);
    return totals;
  }, []);
  const totalWeight = cumulativeWeights.at(-1) ?? 1;
  const weightedProgress = interpolate(
    frame,
    [captionDelayFrames, speechEnd],
    [0, totalWeight],
    clamp,
  );
  const activeWord = Math.min(
    words.length - 1,
    cumulativeWeights.findIndex((end) => weightedProgress < end) === -1
      ? words.length - 1
      : cumulativeWeights.findIndex((end) => weightedProgress < end),
  );
  const chunkStart =
    Math.floor(activeWord / CAPTION_WORDS_PER_CHUNK) * CAPTION_WORDS_PER_CHUNK;
  const visibleWords = words.slice(
    chunkStart,
    chunkStart + CAPTION_WORDS_PER_CHUNK,
  );
  const activeStart = activeWord === 0 ? 0 : cumulativeWeights[activeWord - 1];
  const activeWeight = wordWeights[activeWord] || 1;
  const activeWordProgress = (weightedProgress - activeStart) / activeWeight;
  const activeScale = interpolate(
    activeWordProgress,
    [0, 0.22, 1],
    [0.93, 1.08, 1],
    clamp,
  );

  return (
    <div
      style={{
        minHeight: 174,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        alignContent: 'center',
        gap: '4px 16px',
        padding: '28px 34px',
        border: '1px solid rgba(255,255,255,.12)',
        borderRadius: 30,
        background: 'rgba(5,12,28,.88)',
        boxShadow: '0 22px 80px rgba(0,0,0,.48)',
        backdropFilter: 'blur(18px)',
        fontSize: 53,
        fontWeight: 850,
        lineHeight: 1.14,
        textAlign: 'center',
      }}
    >
      {visibleWords.map((word, index) => {
        const wordIndex = chunkStart + index;
        const highlighted = wordIndex === activeWord;
        return (
          <span
            key={`${wordIndex}-${word}`}
            style={{
              color: highlighted ? 'transparent' : '#f7fbff',
              background: highlighted
                ? `linear-gradient(90deg,${accent},${accentEnd})`
                : undefined,
              backgroundClip: highlighted ? 'text' : undefined,
              WebkitBackgroundClip: highlighted ? 'text' : undefined,
              display: 'inline-block',
              transform: highlighted ? `scale(${activeScale})` : 'scale(1)',
              textShadow: highlighted
                ? `0 0 26px ${accent}88`
                : '0 4px 18px rgba(0,0,0,.55)',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const FallbackVisual = ({scene, accent}: {scene: Scene; accent: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({frame: frame - 8, fps, config: {damping: 16}});
  const orbit = frame * 0.35;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        transform: `scale(${interpolate(reveal, [0, 1], [0.82, 1])})`,
        opacity: reveal,
      }}
    >
      {[0, 1, 2].map((ring) => (
        <div
          key={ring}
          style={{
            position: 'absolute',
            width: 310 + ring * 150,
            height: 310 + ring * 150,
            borderRadius: '50%',
            border: `2px solid ${accent}${ring === 0 ? '55' : '24'}`,
            transform: `rotate(${orbit * (ring % 2 ? -1 : 1)}deg)`,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              margin: -8,
              borderRadius: '50%',
              background: accent,
              boxShadow: `0 0 24px ${accent}`,
            }}
          />
        </div>
      ))}
      <div
        style={{
          width: 570,
          padding: '64px 42px',
          border: `2px solid ${accent}88`,
          borderRadius: 44,
          background: 'rgba(4,18,34,.78)',
          boxShadow: `0 0 100px ${accent}28, inset 0 0 50px ${accent}10`,
          color: '#fff',
          fontSize: scene.id === 'hook' ? 180 : 45,
          fontWeight: 950,
          lineHeight: 1.05,
          letterSpacing: scene.id === 'hook' ? 4 : 1,
          textAlign: 'center',
        }}
      >
        {fallbackSymbols[scene.id] ?? scene.title}
      </div>
    </div>
  );
};

const SceneFrame = ({
  scene,
  index,
  totalScenes,
  durationInFrames,
  visualSettings,
}: {
  scene: Scene;
  index: number;
  totalScenes: number;
  durationInFrames: number;
  visualSettings?: Episode['visualSettings'];
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const accent = BRAND_A;
  const accentEnd = BRAND_B;
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 105}});
  const exit = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames - 1],
    [1, 0],
    clamp,
  );
  const imageScale = interpolate(frame, [0, durationInFrames], [1.1, 1.025], clamp);
  const imageX = interpolate(frame, [0, durationInFrames], [-12, 12], clamp);
  const speechDuration = scene.audioDuration
    ? Math.ceil(scene.audioDuration * fps)
    : Math.max(1, durationInFrames - Math.ceil(SCENE_TAIL_SECONDS * fps));
  const progress = (index + frame / durationInFrames) / totalScenes;
  const character = scene.character || defaultCharacters[scene.id];
  const logo = visualSettings?.logo ?? 'logo/logo.png';

  return (
    <AbsoluteFill
      style={{
        background: '#061022',
        color: '#fff',
        fontFamily: 'Inter, Manrope, Arial, sans-serif',
        overflow: 'hidden',
        opacity: exit,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 20% 38%, ${BRAND_A}30 0, transparent 42%), radial-gradient(circle at 80% 52%, ${BRAND_B}30 0, transparent 44%), #030916`,
        }}
      />
      {logo && <Img
        src={staticFile(logo)}
        style={{
          position:'absolute',
          width:LOGO_LAYOUT.width,
          height:LOGO_LAYOUT.width,
          left:`${LOGO_LAYOUT.x}%`,
          top:`${LOGO_LAYOUT.y}%`,
          transform:'translate(-50%,-50%)',
          objectFit:'contain',
          opacity:LOGO_LAYOUT.opacity,
          zIndex:0,
        }}
      />}
      <div
        style={{
          position: 'absolute',
          zIndex: 1,
          left: 56,
          right: 56,
          top: 390,
          height: 980,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,.14)',
          borderRadius: 44,
          background: '#071629',
          boxShadow: `0 28px 110px ${accent}25`,
        }}
      >
        {scene.image ? (
          <Img
            src={staticFile(scene.image)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translateX(${imageX}px) scale(${imageScale})`,
              translate: "7.6px 37.8px"
            }}
          />
        ) : (
          <FallbackVisual scene={scene} accent={accent} />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg,#f449110d,transparent 50%,#0991df24)',
          }}
        />
      </div>
      <SoundWave x={SOUNDWAVE_LAYOUT.x} y={SOUNDWAVE_LAYOUT.y} />
      <div
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          top: 112,
          textAlign: 'center',
          transform: `translateY(${interpolate(enter, [0, 1], [-42, 0])}px)`,
          opacity: enter,
        }}
      >
        <div
          style={{
            maxWidth: 920,
            margin: '0 auto',
            fontSize: scene.title.length > 28 ? 70 : 84,
            fontWeight: 950,
            lineHeight: 1.02,
            letterSpacing: -3,
            textShadow: '0 10px 40px rgba(0,0,0,.58)',
          }}
        >
          {scene.title}
        </div>
      </div>
      {character && (
        <Img
          src={staticFile(`characters/${character}`)}
          style={{
            position: 'absolute',
            zIndex: 4,
            height: 790,
            right: -55,
            bottom: 270,
            objectFit: 'contain',
            opacity: enter,
            transform: `translateX(${interpolate(enter, [0, 1], [90, 0])}px)`,
            filter: 'drop-shadow(0 24px 50px rgba(0,0,0,.58))',
            translate: "-55px 195.8px"
          }}
        />
      )}
      <div style={{position: 'absolute', zIndex: 6, left: 64, right: 64, bottom: 105}}>
        <Caption
          text={scene.narration}
          durationInFrames={durationInFrames}
          speechDurationInFrames={speechDuration}
          accent={accent}
          accentEnd={accentEnd}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          bottom: 35,
          height: 8,
          overflow: 'hidden',
          borderRadius: 8,
          background: '#18333b',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            borderRadius: 8,
            background: `linear-gradient(90deg,${accent},${accentEnd})`,
            boxShadow: `0 0 18px ${accent}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const ExplainerVideo = ({episode}: {episode: Episode}) => {
  const contentDuration =
    getDuration(episode) - OUTRO_FRAMES;
  let startFrame = 0;

  return (
    <AbsoluteFill style={{
      background: '#030916'
    }}>
      {episode.backgroundMusic && (
        <Audio
          src={staticFile(episode.backgroundMusic)}
          volume={episode.audioSettings?.musicWithVoice ?? 0.12}
          loop
        />
      )}
      {episode.scenes.map((scene, index) => {
        const durationInFrames = getSceneDuration(scene);
        const from = startFrame;
        startFrame += durationInFrames;

        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={durationInFrames}
            premountFor={FPS}
          >
            <SceneFrame
              scene={scene}
              index={index}
              totalScenes={episode.scenes.length}
              durationInFrames={durationInFrames}
              visualSettings={episode.visualSettings}
            />
            {scene.audio && (
              <Audio
                src={staticFile(scene.audio)}
                volume={episode.audioSettings?.voice ?? 1}
              />
            )}
          </Sequence>
        );
      })}
      <Sequence from={contentDuration} durationInFrames={OUTRO_FRAMES} premountFor={FPS}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
