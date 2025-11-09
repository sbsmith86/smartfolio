'use client';

import { User, Sparkles } from 'lucide-react';
import ChatCitation from './ChatCitation';

interface Citation {
  id: string;
  type: 'experience' | 'education' | 'skill' | 'testimonial';
  title: string;
  excerpt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser
          ? 'bg-gradient-to-br from-gray-200 to-gray-300'
          : 'bg-gradient-to-br from-amber-100 to-orange-100'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-gray-700" />
        ) : (
          <Sparkles className="w-4 h-4 text-amber-600" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
            : 'bg-gray-50 text-gray-900'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500">Sources:</span>
            {message.citations.map((citation, index) => (
              <ChatCitation key={`${citation.id}-${index}`} citation={citation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
