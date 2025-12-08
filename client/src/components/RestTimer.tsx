import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Minus, Play, Pause, RotateCcw } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';

interface RestTimerProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeconds?: number;
}

const PRESET_TIMES = [60, 90, 120, 180];

export function RestTimer({ isOpen, onClose, initialSeconds = 90 }: RestTimerProps) {
  const haptic = useHaptic();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSeconds(initialSeconds);
      setTotalSeconds(initialSeconds);
      setIsRunning(false);
      setHasFinished(false);
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setHasFinished(true);
            haptic.success();
            playNotificationSound();
            return 0;
          }
          if (prev <= 4) {
            haptic.light();
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, seconds, haptic]);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBeep = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      playBeep(880, now, 0.15);
      playBeep(1100, now + 0.2, 0.15);
      playBeep(880, now + 0.4, 0.3);
    } catch (e) {
      // Audio not supported
    }
  }, []);

  const handleStart = () => {
    haptic.light();
    setIsRunning(true);
    setHasFinished(false);
  };

  const handlePause = () => {
    haptic.light();
    setIsRunning(false);
  };

  const handleReset = () => {
    haptic.light();
    setSeconds(totalSeconds);
    setIsRunning(false);
    setHasFinished(false);
  };

  const handleAddTime = () => {
    haptic.light();
    setSeconds(prev => prev + 30);
    setTotalSeconds(prev => prev + 30);
  };

  const handleSubtractTime = () => {
    haptic.light();
    if (seconds > 30) {
      setSeconds(prev => prev - 30);
      setTotalSeconds(prev => Math.max(30, prev - 30));
    }
  };

  const handlePreset = (time: number) => {
    haptic.light();
    setSeconds(time);
    setTotalSeconds(time);
    setIsRunning(false);
    setHasFinished(false);
  };

  const progress = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="rest-timer-modal">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-[90vw] max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Отдых</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            data-testid="button-close-timer"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex justify-center gap-2 mb-6">
          {PRESET_TIMES.map(time => (
            <button
              key={time}
              onClick={() => handlePreset(time)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                totalSeconds === time && !isRunning
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              data-testid={`button-preset-${time}`}
            >
              {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </button>
          ))}
        </div>
        
        <div className="relative w-64 h-64 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ${
                hasFinished 
                  ? 'text-green-500' 
                  : seconds <= 10 
                    ? 'text-orange-500' 
                    : 'text-purple-600'
              }`}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold tabular-nums ${
              hasFinished 
                ? 'text-green-500' 
                : 'text-slate-900 dark:text-white'
            }`}>
              {minutes}:{remainingSeconds.toString().padStart(2, '0')}
            </span>
            {hasFinished && (
              <span className="text-green-500 font-medium mt-2">Готово!</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={handleSubtractTime}
            disabled={seconds <= 30 || isRunning}
            className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            data-testid="button-subtract-time"
          >
            <Minus size={20} />
          </button>
          
          {isRunning ? (
            <button
              onClick={handlePause}
              className="p-4 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors"
              data-testid="button-pause-timer"
            >
              <Pause size={28} />
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="p-4 rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-colors"
              data-testid="button-start-timer"
            >
              <Play size={28} className="ml-0.5" />
            </button>
          )}
          
          <button
            onClick={handleAddTime}
            disabled={isRunning}
            className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            data-testid="button-add-time"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <button
          onClick={handleReset}
          className="w-full py-3 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          data-testid="button-reset-timer"
        >
          <RotateCcw size={16} />
          <span className="text-sm font-medium">Сбросить</span>
        </button>
      </div>
    </div>
  );
}
