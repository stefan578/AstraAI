import React, { useState, useEffect, useRef } from 'react';
import { useAI } from '../hooks/useAI';
import { useLocalStorage } from '../utils/localStorage';
import { v4 as uuidv4 } from 'uuid';

const Chat: React.FC = () => {
  const {
    aiService,
    initializing,
    error,
    generateText,
    analyzeImage,
  } = useAI();
  const [conversations, setConversations] = useLocalStorage('conversations', [] as Array<any>);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversations.length === 0) {
      const newConversation = {
        id: uuidv4(),
        title: 'Novi razgovor',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations([newConversation]);
      setCurrentConversationId(newConversation.id);
    } else if (!currentConversationId) {
      const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
      setCurrentConversationId(sorted[0].id);
    }
  }, [conversations.length, currentConversationId]);

  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const sendMessage = async () => {
    if (!input.trim() && !imageUrl) return;
    if (!aiService) {
      alert('AI servis nije dostupan. Proveri podešavanja.');
      return;
    }

    const imageForRequest = imageUrl;
    const textForRequest = input.trim();
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: textForRequest,
      image: imageForRequest ? { url: imageForRequest } : undefined,
      timestamp: Date.now(),
    };

    const updatedConversations = conversations.map(conv =>
      conv.id === currentConversationId
        ? {
            ...conv,
            messages: [...conv.messages, userMessage],
            updatedAt: Date.now(),
            title:
              conv.messages.length === 0 && conv.title === 'Novi razgovor'
                ? textForRequest.substring(0, 30) + (textForRequest.length > 30 ? '...' : '') ||
                  'Slika'
                : conv.title,
          }
        : conv
    );

    setConversations(updatedConversations);
    setInput('');
    setImageUrl(null);

    try {
      setIsLoading(true);

      const systemPrompt = `
Ti si AI asistent za učenje koji govori srpskim jezikom.
Tvoj cilj je da pomogneš učenicima da razumeju koncepte, reše probleme i unaprede svoje znanje.
Objasni jasno, uz primere, i korak po korak kada je potrebno.
Ako učenik postavi pitanje, pruži detaljan odgovor koji objašnjava ne samo „šta“ već i „zašto“.
`;

      let aiResponse: string;

      if (imageForRequest) {
        aiResponse = await analyzeImage(
          imageForRequest,
          textForRequest ||
            'Analiziraj ovu sliku i objasni učeniku šta se na njoj nalazi. Ako je zadatak, reši ga korak po korak.'
        );
      } else {
        aiResponse = await generateText(textForRequest, systemPrompt);
      }

      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };

      setConversations(
        updatedConversations.map(conv =>
          conv.id === currentConversationId
            ? {
                ...conv,
                messages: [...conv.messages, aiMessage],
                updatedAt: Date.now(),
              }
            : conv
        )
      );
    } catch (err) {
      console.error('Error generating AI response:', err);
      alert(
        'Došlo je do greške pri generisanju odgovora. ' +
          (err instanceof Error ? err.message : 'Proveri internet vezu i API ključ.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Molimo izaberi sliku.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Slika je prevelika. Maksimalna veličina je 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const newConversation = () => {
    const newConv = {
      id: uuidv4(),
      title: 'Novi razgovor',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations([...conversations, newConv]);
    setCurrentConversationId(newConv.id);
  };

  const deleteConversation = (id: string) => {
    if (conversations.length <= 1) {
      alert('Ne možete obrisati poslednji razgovor.');
      return;
    }
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovaj razgovor?')) {
      return;
    }
    const remaining = conversations.filter(conv => conv.id !== id);
    setConversations(remaining);
    if (currentConversationId === id) {
      const sorted = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt);
      setCurrentConversationId(sorted[0]?.id || null);
    }
  };

  return (
    <div className="container min-h-[80vh] py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Chat sa AI</h1>
        {currentConversation && (
          <p className="text-gray-600 text-sm">{currentConversation.title}</p>
        )}
      </header>

      {initializing && (
        <div className="card mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-3" />
            <span>Inicijalizacija AI servisa...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="card mb-4 bg-red-50">
          <div className="flex items-start">
            <span className="text-red-500 mt-0.5 h-5 w-5">⚠️</span>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Greška</h3>
              <div className="mt-1 text-sm text-red-700 break-words">{error}</div>
            </div>
          </div>
        </div>
      )}

      {currentConversation ? (
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="mb-6" ref={messagesEndRef} />
          {currentConversation.messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`chat-bubble ${
                msg.role === 'user' ? 'user' : 'ai'
              } ${msg.role === 'assistant' ? 'max-w-[80%] ml-auto' : 'max-w-[80%]'}`}
            >
              {msg.image ? (
                <div className="mb-2">
                  <img
                    src={msg.image.url}
                    alt="Uploaded image"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              ) : null}
              <p className="mb-1 whitespace-pre-wrap">{msg.content}</p>
              <span className="text-xs text-gray-500">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-gray-500">
          Selektujte razgovor da biste započeli čitanje.
        </p>
      )}

      <div className="card pb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <label className="btn-outline cursor-pointer">
              Dodaj sliku
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>
          {imageUrl && (
            <div className="ml-3 relative">
              <img
                src={imageUrl}
                alt="Pregled slike"
                className="h-16 w-16 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white w-6 h-6"
                aria-label="Ukloni sliku"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Napiši pitanje..."
            className="input flex-1 min-h-24 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={isLoading || (!input.trim() && !imageUrl)}
            className="btn-primary"
          >
            {isLoading ? 'Šaljem...' : 'Pošalji'}
          </button>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={newConversation}
            className="btn-outline w-full"
          >
            Novi razgovor
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
