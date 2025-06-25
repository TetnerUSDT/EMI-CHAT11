import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera, Upload, Save, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../hooks/use-toast';

const AvatarUploader = ({ currentAvatar, username, onAvatarUpdate, isOpen, onClose }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast({
        title: t('error'),
        description: 'Please select an image',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await onAvatarUpdate(reader.result);
          toast({
            title: t('success'),
            description: 'Avatar updated successfully!'
          });
          handleClose();
        } catch (error) {
          console.error('Error updating avatar:', error);
          toast({
            title: t('error'),
            description: t('tryAgain'),
            variant: 'destructive'
          });
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error processing file:', error);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-600 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            {t('changeAvatar') || 'Change Avatar'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Avatar Preview */}
          <div className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={currentAvatar} />
              <AvatarFallback className="bg-emerald-600 text-white text-2xl">
                {username?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <p className="text-slate-400 text-sm">{t('currentAvatar') || 'Current Avatar'}</p>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-300 mb-2">{t('selectNewAvatar') || 'Select a new avatar image'}</p>
              <p className="text-slate-500 text-sm mb-4">{t('supportedFormats') || 'Supported formats: JPG, PNG, GIF'}</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('chooseFile') || 'Choose File'}
              </Button>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-4">
                <div className="text-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-2 border-emerald-500"
                  />
                  <p className="text-slate-300 mt-2">Preview</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('chooseAnother') || 'Choose Another'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isUploading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarUploader;