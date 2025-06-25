import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Smile, Heart, ThumbsUp, Star, Zap, Fire } from 'lucide-react';

const StickerPicker = ({ onStickerSelect, isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('emoji');

  // Basic emoji stickers for now
  const stickerCategories = {
    emoji: [
      { id: 'smile', icon: '😊', name: 'Smile' },
      { id: 'heart', icon: '❤️', name: 'Heart' },
      { id: 'thumbs', icon: '👍', name: 'Thumbs Up' },
      { id: 'star', icon: '⭐', name: 'Star' },
      { id: 'fire', icon: '🔥', name: 'Fire' },
      { id: 'rocket', icon: '🚀', name: 'Rocket' },
      { id: 'party', icon: '🎉', name: 'Party' },
      { id: 'cool', icon: '😎', name: 'Cool' },
    ],
    reactions: [
      { id: 'wow', icon: '😮', name: 'Wow' },
      { id: 'laugh', icon: '😂', name: 'Laugh' },
      { id: 'cry', icon: '😢', name: 'Cry' },
      { id: 'angry', icon: '😠', name: 'Angry' },
      { id: 'love', icon: '🥰', name: 'Love' },
      { id: 'think', icon: '🤔', name: 'Think' },
    ]
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 left-4 z-[100]">
      <Card className="w-80 bg-slate-800 border-slate-600 shadow-2xl">
        <CardContent className="p-0">
          {/* Category tabs */}
          <div className="flex border-b border-slate-600">
            {Object.keys(stickerCategories).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-1 p-3 text-sm font-medium capitalize transition-colors ${
                  activeCategory === category
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Stickers grid */}
          <div className="p-4">
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {stickerCategories[activeCategory].map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => {
                    onStickerSelect(sticker);
                    onClose();
                  }}
                  className="w-16 h-16 flex items-center justify-center text-2xl rounded-lg hover:bg-slate-700 transition-colors"
                  title={sticker.name}
                >
                  {sticker.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-600 text-center">
            <p className="text-xs text-slate-400">
              Animated stickers coming soon! 🎭
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StickerPicker;