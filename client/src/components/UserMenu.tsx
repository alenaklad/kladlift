import { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Camera,
  ChevronRight,
  Moon,
  Sun,
  Shield
} from 'lucide-react';
import type { User, UserProfile } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface UserMenuProps {
  user: User;
  profile: UserProfile;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
}

export function UserMenu({ user, profile, isAdmin, onOpenAdmin, onOpenProfile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const urlResponse = await apiRequest('GET', '/api/objects/upload-url');
      const { uploadUrl } = await urlResponse.json();
      
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      const objectUrl = uploadUrl.split('?')[0];
      
      await apiRequest('POST', '/api/objects/set-acl', {
        objectUrl,
        visibility: 'public'
      });

      await apiRequest('PATCH', '/api/auth/user', {
        profileImageUrl: objectUrl
      });

      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const displayName = user.firstName || user.email?.split('@')[0] || 'Пользователь';
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 pr-4 bg-white/80 backdrop-blur-xl rounded-full border border-slate-200/60 shadow-lg shadow-slate-200/40 hover:bg-white hover:shadow-xl transition-all duration-300"
        data-testid="button-user-menu"
      >
        {user.profileImageUrl ? (
          <img 
            src={user.profileImageUrl} 
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-inner">
            {initials}
          </div>
        )}
        <span className="hidden sm:block font-medium text-slate-700 text-sm">
          {displayName}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-72 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden animate-fadeIn z-50">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <div className="flex items-center gap-4">
              <div className="relative group">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt={displayName}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  data-testid="input-avatar-upload"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                onOpenProfile();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-slate-50 transition-colors group"
              data-testid="button-open-profile"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Settings size={18} className="text-slate-500 group-hover:text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">Настройки</p>
                  <p className="text-xs text-slate-500">Профиль и факторы восстановления</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  onOpenAdmin();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-slate-50 transition-colors group"
                data-testid="button-open-admin"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <Shield size={18} className="text-slate-500 group-hover:text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Админ-панель</p>
                    <p className="text-xs text-slate-500">Управление приложением</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            )}
          </div>

          <div className="p-2 pt-0 border-t border-slate-100 mt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-red-50 transition-colors group"
              data-testid="button-logout"
            >
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <LogOut size={18} className="text-slate-500 group-hover:text-red-600" />
              </div>
              <span className="font-medium text-slate-700 group-hover:text-red-600">Выйти</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
