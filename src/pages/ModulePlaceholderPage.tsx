import React from 'react';
import { Layers, CheckCircle2 } from 'lucide-react';

interface ModulePlaceholderPageProps {
  title: string;
  phase: string;
  description: string;
  bullets: string[];
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderPageProps> = ({
  title,
  phase,
  description,
  bullets,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-3xl mx-auto my-6 shadow-2xs">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-4">
        <Layers className="w-3.5 h-3.5" />
        <span>Scheduled for {phase}</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
        {description}
      </p>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Database Tables & Planned Capabilities
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {bullets.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/70"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

