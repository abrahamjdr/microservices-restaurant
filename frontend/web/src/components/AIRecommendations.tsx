'use client';

import { AIRecommendation } from '@/lib/api';

interface Props {
  recommendations: AIRecommendation[];
  loading: boolean;
  generatedAt: string | null;
}

export function AIRecommendations({ recommendations, loading, generatedAt }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">AI Recommendations</h2>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
          GPT-4o
        </span>
      </div>
      {loading && <p className="text-sm text-slate-400">Analyzing inventory...</p>}
      {!loading && recommendations.length === 0 && (
        <p className="text-sm text-slate-400">No recommendations yet</p>
      )}
      {!loading && recommendations.length > 0 && (
        <div className="space-y-2">
          {recommendations.slice(0, 6).map((rec) => (
            <div key={rec.recipeId} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: `hsl(${rec.score * 1.2}, 70%, 90%)`,
                    color: `hsl(${rec.score * 1.2}, 70%, 30%)`,
                  }}
                >
                  {rec.score}
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{rec.recipeName}</p>
                <p className="text-xs text-slate-500 truncate">{rec.reasoning}</p>
              </div>
            </div>
          ))}
          {generatedAt && (
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
              Updated {new Date(generatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
