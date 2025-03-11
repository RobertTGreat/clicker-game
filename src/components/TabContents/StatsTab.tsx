import React from 'react';

type StatsTabProps = {
  pixels: number;
  pixelsPerSecond: number;
  clickPower: number;
  lifetimePixels: number;
  rebirthCount: number;
  formatNumber: (num: number) => string;
};

export default function StatsTab({ 
  pixels, 
  pixelsPerSecond, 
  clickPower, 
  lifetimePixels, 
  rebirthCount, 
  formatNumber 
}: StatsTabProps) {
  return (
    <div className="p-4 h-full">
      <h2 className="text-lg font-mono mb-2">{formatNumber(pixels)} pixels</h2>
      <div className="grid gap-2">
        <p className="text-sm text-gray-300">
          {formatNumber(pixelsPerSecond)} pixels/sec
        </p>
        <p className="text-sm text-gray-300">Click Power: {formatNumber(clickPower)}</p>
        <p className="text-sm text-gray-300">Lifetime Pixels: {formatNumber(lifetimePixels)}</p>
        {rebirthCount > 0 && (
          <p className="text-sm text-violet-400">Rebirths: {rebirthCount}</p>
        )}
      </div>
    </div>
  );
} 