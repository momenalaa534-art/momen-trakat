import React from 'react';

const tajweedColors = {
  h: '#888888', // Hamzat wasl / Silent (Sakin letter)
  s: '#888888', // Silent
  l: '#888888', // Lam Shamsiyyah
  n: '#ff99cc', // Ghunnah / Madd 2
  m: '#cc0000', // Madd Lazim 6
  q: '#0055ff', // Qalqalah
  p: '#e60073', // Madd Muttasil (4/5)
  j: '#ff7f00', // Madd Munfasil
  u: '#00aa00', // Idgham/Ikhfa
  c: '#9900cc', // Iqlab
};

export function renderTajweed(text: string, enabled: boolean) {
  if (!enabled) {
    return <>{text.replace(/\[([a-zA-Z]+)(?::\d+)?\[([^\[\]]+)\]/g, '$2')}</>;
  }

  const parts = [];
  const regex = /\[([a-zA-Z]+)(?::\d+)?\[([^\[\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<React.Fragment key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</React.Fragment>);
    }
    const color = tajweedColors[match[1] as keyof typeof tajweedColors] || 'inherit';
    parts.push(<span key={`tj-${match.index}`} style={{ color }}>{match[2]}</span>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<React.Fragment key={`text-${lastIndex}`}>{text.slice(lastIndex)}</React.Fragment>);
  }

  return <>{parts}</>;
}
