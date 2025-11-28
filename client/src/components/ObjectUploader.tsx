import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image, Video, Loader2 } from 'lucide-react';

interface ObjectUploaderProps {
  onUploadComplete: (url: string) => void;
  accept?: 'image' | 'video' | 'both';
  className?: string;
  label?: string;
  currentUrl?: string;
}

export function ObjectUploader({ 
  onUploadComplete, 
  accept = 'both',
  className = '',
  label = 'Загрузить файл',
  currentUrl
}: ObjectUploaderProps) {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptTypes = () => {
    switch (accept) {
      case 'image':
        return 'image/jpeg,image/png,image/gif,image/webp';
      case 'video':
        return 'video/mp4,video/webm,video/quicktime';
      case 'both':
      default:
        return 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('Файл слишком большой (максимум 50 МБ)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch('/api/objects/upload-url');
      if (!response.ok) {
        throw new Error('Не удалось получить URL для загрузки');
      }
      const { uploadUrl } = await response.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('Ошибка загрузки файла');
      }

      const fileUrl = uploadUrl.split('?')[0];
      
      const aclResponse = await fetch('/api/objects/set-acl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ objectUrl: fileUrl, visibility: 'private' })
      });
      
      if (!aclResponse.ok) {
        console.warn('Не удалось установить права доступа');
      }
      
      const { path: normalizedPath } = await aclResponse.json();
      const finalUrl = normalizedPath || fileUrl;
      
      setUploadedUrl(finalUrl);
      onUploadComplete(finalUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedUrl(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isVideo = (url: string) => {
    return url.includes('video') || url.match(/\.(mp4|webm|mov)$/i);
  };

  if (uploadedUrl) {
    return (
      <div className={`relative rounded-lg overflow-hidden border border-white/10 bg-[#1A1F2E] ${className}`}>
        {isVideo(uploadedUrl) ? (
          <video 
            src={uploadedUrl} 
            className="w-full h-32 object-cover"
            controls
          />
        ) : (
          <img 
            src={uploadedUrl} 
            alt="Загруженный файл" 
            className="w-full h-32 object-cover"
          />
        )}
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="absolute top-2 right-2"
          onClick={handleRemove}
          data-testid="button-remove-upload"
        >
          <X size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptTypes()}
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-24 border-dashed border-2 border-white/20 hover:border-white/40 bg-[#1A1F2E]"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        data-testid="button-open-uploader"
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm">Загрузка...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            {accept === 'video' ? <Video size={24} /> : accept === 'image' ? <Image size={24} /> : <Upload size={24} />}
            <span className="text-sm">{label}</span>
          </div>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2" data-testid="text-upload-error">{error}</p>
      )}
    </div>
  );
}
