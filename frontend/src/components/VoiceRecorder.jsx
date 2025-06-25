import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Play, Pause, Square, Send } from 'lucide-react';

const VoiceRecorder = ({ onSend, isOpen, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      // Convert to base64 for sending
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        onSend({
          type: 'voice',
          data: base64Audio,
          duration: recordingDuration
        });
        handleClose();
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const handleClose = () => {
    setIsRecording(false);
    setIsPlaying(false);
    setRecordingDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    onClose();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full mb-2 left-0 z-50">
      <div className="bg-slate-800 rounded-lg p-4 min-w-72 border border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Голосовое сообщение</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          {/* Recording controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-16 h-16"
              >
                <Mic size={24} />
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 animate-pulse"
              >
                <Square size={24} />
              </Button>
            )}

            {audioBlob && (
              <Button
                onClick={playAudio}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
            )}
          </div>

          {/* Duration display */}
          <div className="text-center">
            <span className="text-slate-300 text-lg font-mono">
              {formatDuration(recordingDuration)}
            </span>
          </div>

          {/* Audio element for playback */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          {/* Send button */}
          {audioBlob && (
            <div className="flex justify-center space-x-2">
              <Button
                onClick={handleClose}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Отменить
              </Button>
              <Button
                onClick={sendVoiceMessage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send size={16} className="mr-2" />
                Отправить
              </Button>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="text-center text-red-400 text-sm">
              🔴 Запись... Нажмите квадрат чтобы остановить
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;