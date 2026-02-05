/**
 * En-tête avec logo Trackly
 */

'use client';

export default function TrackingHeader() {
  return (
    <header className="bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Trackly</h1>
              <p className="text-xs text-stone-500">Suivi de livraison</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
