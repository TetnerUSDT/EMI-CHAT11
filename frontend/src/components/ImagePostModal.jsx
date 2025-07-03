import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const ImagePostModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  imageFile,
  imagePreview 
}) => {
  const [caption, setCaption] = useState('');
  const [compressImage, setCompressImage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!imageFile) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        file: imageFile,
        caption: caption.trim(),
        compress: compressImage
      });
      
      // Reset form
      setCaption('');
      setCompressImage(true);
      onClose();
    } catch (error) {
      console.error('Error submitting image post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCaption('');
    setCompressImage(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5" />
            <span>Отправить изображение</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg border border-slate-600"
              />
              <p className="text-xs text-gray-400 mt-2">
                Для редактирования нажмите на изображение.
              </p>
            </div>
          )}

          {/* Compress Image Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="compressImage"
              checked={compressImage}
              onChange={(e) => setCompressImage(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="compressImage" className="text-sm text-gray-300">
              Сжать изображение
            </label>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Подпись
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Добавьте описание к изображению..."
              className="w-full min-h-[2.5rem] max-h-32 p-3 bg-slate-700 border border-slate-600 text-white placeholder-gray-400 rounded-md resize-none overflow-y-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={500}
              rows={1}
              style={{
                lineHeight: '1.5',
                resize: 'none'
              }}
              onInput={(e) => {
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              {caption.length}/500 символов
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-700"
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !imageFile}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Отправляем...' : 'Отправить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePostModal;