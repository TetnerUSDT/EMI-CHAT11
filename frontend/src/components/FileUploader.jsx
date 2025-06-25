import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Upload, File, Image, Video, X, Send } from 'lucide-react';

const FileUploader = ({ onFileSelect, isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images and videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const sendFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    
    try {
      // Convert file to base64 for sending
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result;
        onFileSelect({
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          data: base64Data
        });
        handleClose();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Ошибка при отправке файла');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploading(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image size={20} />;
    if (fileType.startsWith('video/')) return <Video size={20} />;
    return <File size={20} />;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full mb-2 left-0 z-50">
      <Card className="w-96 bg-slate-800 border-slate-600">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-600">
            <h3 className="text-white font-medium">Отправить файл</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-slate-400 hover:text-white"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-300 mb-2">
                  Перетащите файл сюда или нажмите для выбора
                </p>
                <p className="text-slate-500 text-sm">
                  Максимальный размер: 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* File info */}
                <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                  <div className="text-emerald-400">
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div className="rounded-lg overflow-hidden">
                    {selectedFile.type.startsWith('image/') && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                    )}
                    {selectedFile.type.startsWith('video/') && (
                      <video
                        src={previewUrl}
                        controls
                        className="w-full h-48"
                      />
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-between space-x-2">
                  <Button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                    }}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Выбрать другой
                  </Button>
                  <Button
                    onClick={sendFile}
                    disabled={uploading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Отправить
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUploader;