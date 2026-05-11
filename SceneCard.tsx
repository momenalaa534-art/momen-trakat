import React from 'react';
import { Scene } from '../types';
import { CopyButton } from './CopyButton';

interface SceneCardProps {
  scene: Scene;
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 hover:border-brand-500/30 transition-colors duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-brand-600 text-xs px-2 py-1 rounded-md">مشهد {scene.sceneNumber}</span>
            <span className="text-slate-300 text-lg font-medium">{scene.location}</span>
          </h3>
        </div>
      </div>

      <div className="space-y-6">
        {/* Technical Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400 bg-slate-900/50 p-3 rounded-lg">
          <div><span className="text-brand-400 font-semibold">الفعل (Action):</span> {scene.actionDescription}</div>
          <div><span className="text-brand-400 font-semibold">الإضاءة:</span> {scene.lighting}</div>
          <div><span className="text-brand-400 font-semibold">الكاميرا:</span> {scene.cameraAngle}</div>
        </div>

        {/* Image Prompt */}
        <div className="bg-slate-900/80 rounded-lg p-4 border-s-4 border-purple-500">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-purple-400">وصف الصورة (Prompt)</h4>
            <CopyButton text={scene.imagePrompt} />
          </div>
          <p className="text-slate-300 text-sm leading-relaxed font-mono" dir="ltr">{scene.imagePrompt}</p>
        </div>

        {/* Animation Prompt */}
        <div className="bg-slate-900/80 rounded-lg p-4 border-s-4 border-blue-500">
           <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-blue-400">وصف التحريك (Video Prompt)</h4>
            <CopyButton text={scene.animationPrompt} />
          </div>
          <p className="text-slate-300 text-sm leading-relaxed font-mono" dir="ltr">{scene.animationPrompt}</p>
        </div>

        {/* Dialogue */}
        {scene.dialogue.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">الحوار / السيناريو</h4>
            <div className="space-y-3">
              {scene.dialogue.map((line, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="font-bold text-brand-300 shrink-0 min-w-[80px] text-end">{line.character}:</div>
                  <div className="text-slate-200">{line.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};