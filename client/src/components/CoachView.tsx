import { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  Send, 
  Camera,
  Dumbbell,
  Leaf,
  Zap,
  Moon
} from 'lucide-react';
import { 
  COACH_PERSONAS, 
  type CoachPersonaId, 
  type ChatMessage,
  type UserProfile,
  type Workout 
} from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface CoachViewProps {
  user: UserProfile;
  workouts: Workout[];
  onBack: () => void;
}

const COACH_ICONS = {
  training: Dumbbell,
  nutrition: Leaf,
  motivation: Zap,
  recovery: Moon
};

const COACH_COLORS = {
  training: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  nutrition: { bg: 'bg-green-500/20', text: 'text-green-400' },
  motivation: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  recovery: { bg: 'bg-purple-500/20', text: 'text-purple-400' }
};

export function CoachView({ user, workouts, onBack }: CoachViewProps) {
  const [activeCoachId, setActiveCoachId] = useState<CoachPersonaId | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('kladlift_chat_history');
    return saved ? JSON.parse(saved) : {};
  });
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, activeCoachId]);

  useEffect(() => {
    localStorage.setItem('kladlift_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const getInitialGreeting = (id: CoachPersonaId): string => {
    switch (id) {
      case 'training': return 'Привет! Готов разобрать твою технику или составить план?';
      case 'nutrition': return 'Привет! Присылай фото еды, посчитаем калории.';
      case 'motivation': return 'Сложный день? Давай вернем твой фокус.';
      case 'recovery': return 'Как спалось? Обсудим твое восстановление.';
      default: return 'Привет!';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !selectedImage) return;
    if (!activeCoachId) return;

    const coachId = activeCoachId;
    const currentHistory = chatHistory[coachId] || [{ 
      role: 'assistant' as const, 
      text: getInitialGreeting(coachId) 
    }];

    const userMsg: ChatMessage = { 
      role: 'user', 
      text: inputValue, 
      image: selectedImage || undefined 
    };

    const newHistory = [...currentHistory, userMsg];
    setChatHistory(prev => ({ ...prev, [coachId]: newHistory }));

    setInputValue('');
    const imageToSend = selectedImage ? selectedImage.split(',')[1] : null;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/chat', {
        coachId,
        message: inputValue,
        image: imageToSend,
        history: newHistory.slice(-10),
        userContext: {
          goal: user.goal,
          experienceYears: user.experienceYears,
          sleep: user.sleep,
          stress: user.stress,
          recentWorkouts: workouts.slice(-5).map(w => ({
            date: w.date,
            exercises: w.exercises.length
          }))
        }
      });

      const aiText = response.response || 'Извините, произошла ошибка. Попробуйте еще раз.';

      setChatHistory(prev => ({
        ...prev,
        [coachId]: [...newHistory, { role: 'assistant' as const, text: aiText }]
      }));
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => ({
        ...prev,
        [coachId]: [...newHistory, { 
          role: 'assistant' as const, 
          text: 'Извините, произошла ошибка связи. Попробуйте позже.' 
        }]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeCoachId) {
    return (
      <div className="flex flex-col h-screen bg-[#0A0E1A] animate-slideUp text-white">
        <div className="p-6 border-b border-white/5 bg-[#111827]">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack} 
              className="p-2 -ml-2 rounded-full hover:bg-white/10 text-gray-300"
              data-testid="button-back"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white">Команда KladLift</h1>
          </div>
          <p className="text-gray-400 mt-1">Твой персональный штаб экспертов.</p>
        </div>
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 gap-4">
          {(Object.entries(COACH_PERSONAS) as [CoachPersonaId, typeof COACH_PERSONAS[CoachPersonaId]][]).map(([id, coach]) => {
            const Icon = COACH_ICONS[id];
            const colors = COACH_COLORS[id];
            return (
              <button 
                key={id} 
                onClick={() => setActiveCoachId(id)} 
                className="bg-[#111827] p-6 rounded-3xl shadow-sm border border-white/5 text-left flex items-center gap-5 hover:border-white/20 transition-all active:scale-[0.98]"
                data-testid={`button-coach-${id}`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
                  <Icon size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{coach.name}</h3>
                  <p className="text-gray-400 text-sm mt-1 leading-snug">{coach.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const activeCoach = COACH_PERSONAS[activeCoachId];
  const Icon = COACH_ICONS[activeCoachId];
  const colors = COACH_COLORS[activeCoachId];
  const history = chatHistory[activeCoachId] || [{ 
    role: 'assistant' as const, 
    text: getInitialGreeting(activeCoachId) 
  }];

  return (
    <div className="flex flex-col h-screen bg-[#0A0E1A] animate-slideInRight text-white">
      <div className="flex items-center p-4 bg-[#111827]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <button 
          onClick={() => setActiveCoachId(null)} 
          className="p-2 -ml-2 mr-2 rounded-full hover:bg-white/10 text-gray-400"
          data-testid="button-back-to-coaches"
        >
          <ChevronLeft size={24} />
        </button>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${colors.bg} ${colors.text}`}>
          <Icon size={16} />
        </div>
        <div>
          <h2 className="font-bold text-white">{activeCoach.name}</h2>
          <p className="text-xs text-gray-500">Онлайн</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-4 rounded-3xl ${
                msg.role === 'user' 
                  ? 'bg-white text-[#0A0E1A] rounded-br-lg' 
                  : 'bg-[#1A1F2E] text-gray-200 rounded-bl-lg shadow-sm border border-white/5'
              }`}
              data-testid={`message-${msg.role}-${idx}`}
            >
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="Uploaded" 
                  className="rounded-2xl mb-2 max-w-full"
                />
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1A1F2E] p-4 rounded-3xl rounded-bl-lg shadow-sm border border-white/5">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#111827] border-t border-white/5">
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="h-20 rounded-xl"
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              data-testid="button-remove-image"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-[#1A1F2E] rounded-full text-gray-400 hover:bg-[#252A3A] transition-colors"
            data-testid="button-upload-image"
          >
            <Camera size={20} />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-[#1A1F2E] rounded-full px-5 py-3 outline-none text-white placeholder-gray-500 focus:ring-2 focus:ring-white/20 transition-all"
            data-testid="input-chat-message"
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() && !selectedImage}
            className="p-3 bg-white text-[#0A0E1A] rounded-full disabled:opacity-40 hover:bg-gray-100 transition-colors"
            data-testid="button-send-message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
