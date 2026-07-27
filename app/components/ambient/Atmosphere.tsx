"use client";

import { useMemo } from "react";
import type { SceneName } from "../../domain/types";

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function AmbientScene({ scene, seed }: { scene: SceneName; seed: number }) {
  const layout = useMemo(() => {
    const sceneOffset = { leaves: 117, rain: 229, waves: 347, sky: 463 }[scene];
    const random = seededRandom(seed + sceneOffset);
    const between = (minimum: number, maximum: number) =>
      minimum + random() * (maximum - minimum);
    const waveTempo = between(10.5, 13);
    const rippleSources: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    let rippleAttempts = 0;

    while (rippleSources.length < 6 && rippleAttempts < 120) {
      rippleAttempts += 1;
      const candidate = {
        x: between(7, 93),
        y: between(8, 92),
        width: between(250, 500),
        height: 0,
      };
      candidate.height = candidate.width * between(0.27, 0.34);
      const hasRoom = rippleSources.every((source) => {
        const horizontal = source.x - candidate.x;
        const vertical = (source.y - candidate.y) * 1.35;
        return Math.hypot(horizontal, vertical) >= 22;
      });
      if (hasRoom) rippleSources.push(candidate);
    }

    const ripples = rippleSources.map((source, index, sources) => {
      const nearbySources = sources.filter((other, otherIndex) => {
        if (otherIndex === index) return false;
        return Math.hypot(other.x - source.x, (other.y - source.y) * 1.35) < 34;
      }).length;
      return {
        ...source,
        delay: -(index * (waveTempo / 3) + between(0, 2.4)),
        duration: waveTempo + between(-0.8, 0.8),
        opacity: Math.max(0.28, 0.48 - nearbySources * 0.055),
      };
    });

    return {
      rain: Array.from({ length: 96 }, () => ({
        x: between(-4, 104),
        length: between(34, 82),
        width: between(1, 2.4),
        opacity: between(0.24, 0.5),
        delay: -between(0, 18),
        duration: between(12, 20),
        drift: between(-14, -5),
      })),
      branches: Array.from({ length: 12 }, (_, index) => ({
        side: index % 2 ? "left" : "right",
        y: between(2, 94),
        width: between(150, 330),
        delay: -between(0, 8),
        duration: between(7.5, 11.5),
        leaves: Array.from({ length: 7 }, (_, leafIndex) => ({
          position: 5 + leafIndex * 14 + between(-3, 3),
          side: leafIndex % 2,
          rotation: (leafIndex % 2 ? 112 : -25) + between(-12, 12),
          scale: between(0.78, 1.24),
          opacity: between(0.42, 0.78),
          delay: -between(0, 7),
          duration: between(5.5, 8.5),
        })),
      })),
      ripples,
      stars: Array.from({ length: 96 }, () => ({
        x: between(1, 99),
        y: between(1, 97),
        size: between(2, 5.5),
        opacity: between(0.22, 0.66),
        delay: -between(0, 8),
        duration: between(4.8, 8.5),
      })),
      clouds: Array.from({ length: 6 }, () => ({
        x: between(-18, 82),
        y: between(2, 88),
        width: between(150, 320),
        height: between(48, 92),
        opacity: between(0.2, 0.4),
        delay: -between(0, 24),
        duration: between(22, 36),
        drift: between(18, 28),
      })),
    };
  }, [scene, seed]);

  return (
    <div className="environment" data-scene={scene} aria-hidden="true">
      {scene === "rain" && layout.rain.map((drop, index) => (
        <i
          className="environment__rain-drop"
          key={index}
          style={
            {
              "--rain-x": `${drop.x}%`,
              "--rain-length": `${drop.length}px`,
              "--rain-width": `${drop.width}px`,
              "--rain-opacity": drop.opacity,
              "--rain-delay": `${drop.delay}s`,
              "--rain-duration": `${drop.duration}s`,
              "--rain-drift": `${drop.drift}vw`,
            } as React.CSSProperties
          }
        />
      ))}
      {scene === "leaves" && (
        <div className="environment__canopy">
          {layout.branches.map((branch, branchIndex) => (
            <span
              className="environment__branch"
              data-side={branch.side}
              key={branchIndex}
              style={
                {
                  "--branch-y": `${branch.y}%`,
                  "--branch-width": `${branch.width}px`,
                  "--branch-delay": `${branch.delay}s`,
                  "--branch-duration": `${branch.duration}s`,
                } as React.CSSProperties
              }
            >
              {branch.leaves.map((leaf, leafIndex) => (
                <i
                  key={leafIndex}
                  style={
                    {
                      "--leaf-position": `${leaf.position}%`,
                      "--leaf-side": leaf.side,
                      "--leaf-rotation": `${leaf.rotation}deg`,
                      "--leaf-scale": leaf.scale,
                      "--leaf-opacity": leaf.opacity,
                      "--leaf-delay": `${leaf.delay}s`,
                      "--leaf-duration": `${leaf.duration}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </span>
          ))}
        </div>
      )}
      {scene === "waves" && (
        <>
          {layout.ripples.map((ripple, rippleIndex) => (
            <div
              className="environment__ripples"
              key={rippleIndex}
              style={
                {
                  "--ripple-x": `${ripple.x}%`,
                  "--ripple-y": `${ripple.y}%`,
                  "--ripple-width": `${ripple.width}px`,
                  "--ripple-height": `${ripple.height}px`,
                  "--ripple-delay": `${ripple.delay}s`,
                  "--ripple-duration": `${ripple.duration}s`,
                  "--ripple-opacity": ripple.opacity,
                } as React.CSSProperties
              }
            >
              {Array.from({ length: 6 }, (_, ringIndex) => (
                <span
                  key={ringIndex}
                  style={{ "--ripple-index": ringIndex } as React.CSSProperties}
                />
              ))}
            </div>
          ))}
        </>
      )}
      {scene === "sky" && (
        <>
          {layout.clouds.map((cloud, index) => (
            <div
              className="environment__cloud"
              key={index}
              style={
                {
                  "--cloud-x": `${cloud.x}%`,
                  "--cloud-y": `${cloud.y}%`,
                  "--cloud-width": `${cloud.width}px`,
                  "--cloud-height": `${cloud.height}px`,
                  "--cloud-opacity": cloud.opacity,
                  "--cloud-delay": `${cloud.delay}s`,
                  "--cloud-duration": `${cloud.duration}s`,
                  "--cloud-drift": `${cloud.drift}vw`,
                } as React.CSSProperties
              }
            />
          ))}
          <div className="environment__stars">
            {layout.stars.map((star, index) => (
              <span
                key={index}
                style={
                  {
                    "--star-x": `${star.x}%`,
                    "--star-y": `${star.y}%`,
                    "--star-size": `${star.size}px`,
                    "--star-opacity": star.opacity,
                    "--star-delay": `${star.delay}s`,
                    "--star-duration": `${star.duration}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function FilmSurface() {
  return (
    <>
      <svg
        className="film-surface film-surface--paper"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <filter id="evenward-paper-fiber" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.2"
            numOctaves="3"
            seed="23"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0.48 0 0 0 0.30 0 0.42 0 0 0.22 0 0 0.30 0 0.13 0 0 0 .58 0"
          />
        </filter>
        <rect width="100" height="100" filter="url(#evenward-paper-fiber)" />
      </svg>
      <svg
        className="film-surface film-surface--grain"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <filter id="evenward-film-grain" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="4"
            seed="41"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 .72 0"
          />
        </filter>
        <rect width="100" height="100" filter="url(#evenward-film-grain)" />
      </svg>
    </>
  );
}

