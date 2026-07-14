import React from 'react';

export function SkeletonCard({ height = '120px' }) {
  return <div className="skeleton skeleton-card" style={{ height }} />;
}

export function SkeletonText({ width = '100%', height = '14px' }) {
  return <div className="skeleton skeleton-text" style={{ width, height }} />;
}

export function SkeletonAvatar({ size = '48px' }) {
  return <div className="skeleton skeleton-avatar" style={{ width: size, height: size }} />;
}

export function SkeletonStats() {
  return (
    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="stat-card">
          <div className="skeleton skeleton-text" style={{ width: '40px', height: '28px', margin: '0 auto 8px' }} />
          <div className="skeleton skeleton-text" style={{ width: '60px', height: '12px', margin: '0 auto' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonMatchCard() {
  return (
    <div className="match-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton skeleton-text" style={{ width: '120px', height: '12px', marginBottom: '12px' }} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '60px', height: '14px', margin: '0 auto 8px' }} />
          <div className="skeleton skeleton-text" style={{ width: '32px', height: '32px', margin: '0 auto' }} />
        </div>
        <span className="text-muted">✕</span>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ width: '60px', height: '14px', margin: '0 auto 8px' }} />
          <div className="skeleton skeleton-text" style={{ width: '32px', height: '32px', margin: '0 auto' }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPlayerCard() {
  return (
    <div className="player-card-fut bronze" style={{ pointerEvents: 'none', opacity: 0.5 }}>
      <div className="skeleton skeleton-text" style={{ width: '30px', height: '24px', marginBottom: '8px' }} />
      <div className="skeleton skeleton-avatar" style={{ width: '64px', height: '64px', margin: '0 auto 8px' }} />
      <div className="skeleton skeleton-text" style={{ width: '80px', height: '14px', margin: '0 auto' }} />
    </div>
  );
}
