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
  } = useAI();
  const [conversations, setConversations] = useLocalStorage('conversations', [] as Array<any>);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load current conversation or create a new one if none exists
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
      // Set to the most recent conversation
      const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
      setCurrentConversationId(sorted[0].id);
    }
  }, [conversations.length, currentConversationId]);

  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const sendMessage = async () => {
    if (!input.trim() && !imageUrl) return;
    if (!aiService) {
      alert('AI servis nije disponibilan. Proveri podešavanja.');
      return;
    }

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      image: imageUrl ? { url: imageUrl } : undefined,
      timestamp: Date.now(),
    };

    // Add user message to current conversation
    const updatedConversations = conversations.map(conv =>
      conv.id === currentConversationId
        ? {
            ...conv,
            messages: [...conv.messages, userMessage],
            updatedAt: Date.now(),
            // Update title if it's the first message and title is default
            title:
              conv.messages.length === 0 && conv.title === 'Novi razgovor'
                ? input.substring(0, 30) + (input.length > 30 ? '...' : '')
                : conv.title
          }
        : conv
    );

    setConversations(updatedConversations);
    setInput('');
    setImageUrl(null);

    // Find the updated conversation to get the full message history
    const updatedConv = updatedConversations.find(
      c => c.id === currentConversationId
    )!;

    // Prepare messages for AI (convert to format expected by AI service)
    const formattedMessages = updatedConv.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.image ? `[Slika attached] ${msg.content}` : msg.content,
    }));

    try {
      setIsLoading(true);
      // Generate AI response
      const systemPrompt = `
        Ti si AI asistent za učenje koji govori srpskim jezikom.
        Tvoj cilj je da pomogneš učenicima da razumeju koncepte, reše problemi i unaprede svoje znanje.
        Objasni jasno, uz primere, i korak po korak kada je potrebno.
        Ako učenik postavi pitanje, pruži detaljan odgovor koji obrazjašnjava ne samo "šta" već i "zašto".
        Ako se pitanje odnosi na sliku, opisuj šta vidiš na slici i veži sa kontekstom pitanja.
        Ne pretvaraj da znáš informacije koje ti nisu date u pitanju ili na slici.
      `;

      const lastUserMessage = formattedMessages[formattedMessages.length - 1];
      const aiResponse = await generateText(
        lastUserMessage.content,
        systemPrompt
      );

      const aiMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };

      // Add AI message to conversation
      setConversations(
        conversations.map(conv =>
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
          'Proveri internet vezu i API ključ.'
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

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
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
      alert('Ne możete obrisati poslednji razgovor.');
      return;
    }
    if (!window.confirm('Da li ste sigurni da želite da obrisete ovaj razgovor?')) {
      return;
    }
    setConversations(conversations.filter(conv => conv.id !== id));
    if (currentConversationId === id) {
      // Switch to the most recent remaining conversation
      const sorted = [...conversations]
        .filter(conv => conv.id !== id)
        .sort((a, b) => b.updatedAt - a.updatedAt);
      setCurrentConversationId(sorted[0]?.id || null);
    }
  };

  return (
    <div className="container min-h-[80vh] py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Chat sa AI</h1>
        {currentConversation && (
          <p className="text-gray-600 text-sm">
            {currentConversation.title}
          </p>
        )}
      </header>

      {/* AI Status */}
      {initializing && (
        <div className="card mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-3"></div>
            <span>Inicijalizacija AI servisa...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="card mb-4 bg-red-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {/* Warning icon */}
              <span className="text-red-500 mt-0.5 h-5 w-5">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Greška</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {currentConversation ? (
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="mb-6" ref={messagesEndRef}></div>
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
              <p className="mb-1">{msg.content}</p>
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

      {/* Input Area */}
      <div className="card pb-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {/* Image icon */}
              <span className={imageUrl ? 'text-indigo-500' : 'text-gray-400'} hover:text-indigo-500>
                📎
              </span>
            </label>
          </div>
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Poruka AI..."
              rows={2}
              className="input w-full resize-none"
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={sendMessage}
            disabled={isLoading || (!input.trim() && !imageUrl)}
            className="btn-primary"
          >
            {isLoading ? 'Šalje se...' : 'Pošalji'}
          </button>
        </div>
      </div>

      {/* Conversation List (mobile: we'll show as a modal or separate page, but for simplicity we'll show as a sidebar on desktop) */}
      {/* For mobile, we could use a bottom sheet, but we'll keep it simple and show as a list on the left in larger screens */}
      <div className="hidden md:block mt-6">
        <div className="card">
          <h3 className="font-medium mb-3">Razgovori</h3>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setCurrentConversationId(conv.id)}
                className={`p-3 cursor-pointer rounded hover:bg-gray-50 ${
                  currentConversationId === conv.id
                    ? 'bg-indigo-50 border-l-4 border-indigo-500'
                    : ''
                }`}
              >
                <div className="font-medium">{conv.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(conv.updatedAt).toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <button
              onClick={newConversation}
              className="btn-outline w-full"
            >
              Novi razgovor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;