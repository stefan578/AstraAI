import React, { useState } from 'react';
import { useLocalStorage } from '../utils/localStorage';
import { AIServiceFactory } from '../services/ai/AIService';

const Settings: React.FC = () => {
  const [provider, setProvider] = useLocalStorage('aiProvider', 'gemini');
  const [apiKey, setApiKey] = useLocalStorage('aiApiKey', '');
  const [model] = useLocalStorage('aiModel', '');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [showKey, setShowKey] = useState(false);

  const providers = [
    { id: 'gemini', name: 'Google Gemini', icon: '✨' },
    { id: 'nvidia', name: 'NVIDIA AI', icon: '⚡' },
  ];

  const effectiveModel =
    model.trim() ||
    (provider === 'gemini'
      ? 'gemini-3.8-flash'
      : 'nvidia/nemotron-3-super-120b-a12b');

  const handleSave = async () => {
    const key = apiKey.trim();

    if (!key) {
      setStatus('error');
      setStatusMessage('API ključ ne može biti prazan.');
      return;
    }

    setStatus('testing');
    setStatusMessage('Testiram vezu...');

    try {
      const service = AIServiceFactory.create({
        name: provider,
        apiKey: key,
        model: effectiveModel,
        supportsImage: provider === 'gemini',
      });

      await service.generateText(
        'Odgovori samo sa: OK',
        'Ti si test konekcije za AstraAI. Odgovori samo sa OK.'
      );

      // Values are already persisted by useLocalStorage. The request above
      // verifies the exact key/provider currently entered in this screen.
      setStatus('success');
      setStatusMessage('Veza sa AI servisom je uspešna.');
    } catch (err) {
      console.error('AI connection test failed:', err);
      setStatus('error');
      setStatusMessage(
        err instanceof Error ? err.message : 'Došlo je do greške pri testiranju veze.'
      );
    }
  };

  const handleDeleteKey = () => {
    if (window.confirm('Da li ste sigurni da želite da obrišete API ključ?')) {
      setApiKey('');
      setStatus('idle');
      setStatusMessage('');
    }
  };

  return (
    <div className="container min-h-[80vh] py-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Podešavanja AI</h2>

        <div className="mb-6">
          <h3 className="font-medium mb-3">AI servis</h3>
          <p className="text-gray-600 mb-4">Izaberi AI servis koji želiš da koristiš.</p>

          <div className="space-y-3">
            {providers.map((prov) => (
              <div
                key={prov.id}
                className={`flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer ${
                  provider === prov.id ? 'border-indigo-500 bg-indigo-50' : ''
                }`}
                onClick={() => {
                  setProvider(prov.id);
                  setStatus('idle');
                  setStatusMessage('');
                }}
              >
                <div className="flex-shrink-0 text-2xl">{prov.icon}</div>
                <div className="flex-1 ml-3">
                  <div className="font-medium">{prov.name}</div>
                  <div className="text-sm text-gray-500">
                    {prov.id === 'gemini'
                      ? 'Koristi svoj Gemini API ključ.'
                      : 'Koristi svoj NVIDIA API ključ.'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-3">API ključ</h3>
          <div className="flex items-center mb-3">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setStatus('idle');
                setStatusMessage('');
              }}
              placeholder="Unesi API ključ"
              className="input flex-1 mr-3"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="btn-outline"
              aria-label={showKey ? 'Sakrij API ključ' : 'Prikaži API ključ'}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={status === 'testing'}
              className="btn-primary mr-3"
            >
              {status === 'testing' ? 'Testiram vezu...' : 'Sačuvaj i testiraj'}
            </button>

            <button
              type="button"
              onClick={handleDeleteKey}
              disabled={!apiKey || status === 'testing'}
              className="btn-outline text-red-500"
            >
              Obriši API ključ
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-3">Model</h3>
          <p className="text-gray-600 mb-4">
            Podrazumevani model se koristi ako nisi uneo sopstveni model.
          </p>
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium">{effectiveModel}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-3">Status</h3>
          {status === 'idle' && (
            <p className="text-gray-500">
              Unesi API ključ i klikni „Sačuvaj i testiraj“.
            </p>
          )}
          {status === 'testing' && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500 mr-3" />
              <span>Testiram vezu...</span>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center text-green-600">
              <span>✅</span>
              <div className="ml-3">{statusMessage}</div>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-start text-red-600">
              <span>⚠️</span>
              <div className="ml-3 break-words">{statusMessage}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
