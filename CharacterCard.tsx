import React from 'react';
import { StoryAsset } from '../types';
import { CopyButton } from './CopyButton';

interface AssetCardProps {
  asset: StoryAsset;
}

export const CharacterCard: React.FC<AssetCardProps> = ({ asset }) => {
  // Determine badge color based on type
  const getBadgeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('location') || t.includes('مكان') || t.includes('building')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (t.includes('vehicle') || t.includes('مركبة') || t.includes('سيارة')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (t.includes('prop') || t.includes('أداة') || t.includes('object')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30'; // Default (Character)
  };

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg flex flex-col h-full relative group">
      <div className="absolute top-3 left-3">
         <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getBadgeColor(asset.type || 'Character')}`}>
            {asset.type || 'شخصية'}
         </span>
      </div>
      
      <div className="p-5 flex-1 pt-10">
        <h3 className="text-lg font-bold text-white mb-1">{asset.name}</h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-4" title={asset.description}>{asset.description}</p>
        
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">أمر الإنشاء (Prompt)</span>
            <CopyButton text={asset.imagePrompt} />
          </div>
          <p className="text-xs text-slate-300 font-mono leading-relaxed opacity-90" dir="ltr">
            {asset.imagePrompt}
          </p>
        </div>
      </div>
    </div>
  );
};