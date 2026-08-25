import React from 'react';
import {interpolate, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';

export const SoundWave = ({
  x = 50,
  y = 52,
  colorA = '#f44911',
  colorB = '#0991df',
}: {
  x?: number;
  y?: number;
  colorA?: string;
  colorB?: string;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;

  return (
    <div style={{position:'absolute',left:`${x}%`,top:`${y}%`,transform:'translate(-50%,-50%)',display:'flex',gap:8,zIndex:3}}>
      {Array.from({length:28},(_,i)=>{
        const wave=Math.sin(time*4.2+i*.58)*.62+Math.sin(time*1.9-i*.31)*.38;
        const scale=interpolate(wave,[-1,1],[.2,1]);
        const color=interpolateColors(i,[0,27],[colorA,colorB]);
        return <div key={i} style={{width:8,height:46,borderRadius:8,background:color,boxShadow:`0 0 12px ${color}66`,transform:`scaleY(${scale})`}}/>;
      })}
    </div>
  );
};
