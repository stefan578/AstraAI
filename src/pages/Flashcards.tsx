import React, { useState, useEffect } from 'react';
import { useAI } from '../hooks/useAI';
import { useLocalStorage } from '../utils/localStorage';

type FlashcardItem = {
  id: string;
  front: string;
  back: string;
  difficult: boolean;
  learned: boolean;
};

const Flashcards: React.FC = () => {
  const { aiService, generateFlashcards } = useAI();
  const [flashcards, setFlashcards] = useLocalStorage<FlashcardItem[]>('flashcards', []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    setShuffledIndices(Array.from({ length: flashcards.length }, (_, i) => i));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards.length]);

  const resetShuffle = (length = flashcards.length) => {
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const markDifficult = () => {
    if (!flashcards.length || shuffledIndices.length !== flashcards.length) return;
    const actualIndex = shuffledIndices[currentIndex];
    setFlashcards(flashcards.map((card, index) =>
      index === actualIndex ? { ...card, difficult: !card.difficult } : card
    ));
  };

  const markLearned = () => {
    if (!flashcards.length || shuffledIndices.length !== flashcards.length) return;
    const actualIndex = shuffledIndices[currentIndex];
    setFlashcards(flashcards.map((card, index) =>
      index === actualIndex ? { ...card, learned: true } : card
    ));
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const generateFromTopic = async () => {
    if (!topic.trim()) {
      setGenerateError('Molimo unesite temu za generisanje flash kartica.');
      return;
    }
    if (!aiService) {
      setGenerateError('AI servis nije dostupan. Proveri podešavanja.');
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const newCards = await generateFlashcards(topic.trim());
      const mappedCards: FlashcardItem[] = newCards
        .filter((card) => card && card.front && card.back)
        .map((card) => ({
          id: crypto.randomUUID(),
          front: String(card.front),
          back: String(card.back),
          difficult: false,
          learned: false,
        }));
      const updated = [...flashcards, ...mappedCards];
      setFlashcards(updated);
      resetShuffle(updated.length);
      setTopic('');
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setGenerateError(err instanceof Error ? err.message : 'Došlo je do greške pri generisanju flash kartica.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    if (window.confirm('Da li ste sigurni da želite da obrišete sve flash kartice?')) {
      setFlashcards([]);
      setShuffledIndices([]);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="container min-h-[80vh] py-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Flash kartice</h2>
          <p className="text-gray-600 mb-6">Još nemate flash kartice. Generiši ih iz teme.</p>
          <div className="space-y-4">
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Unesi temu (npr. Pitagorina teorema)" className="input w-full" />
            <button onClick={() => void generateFromTopic()} disabled={isGenerating} className="btn-primary w-full">
              {isGenerating ? 'Generiše se...' : 'Generiši flash kartice'}
            </button>
            {generateError && <p className="text-sm text-red-500 mt-2">{generateError}</p>}
          </div>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[shuffledIndices[currentIndex] ?? 0];

  return (
    <div className="container min-h-[80vh] py-6">
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Flash kartice</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => resetShuffle()} className="btn-outline">Shuffle</button>
            <button onClick={clearAll} className="btn-outline text-red-500">Obriši sve</button>
          </div>
        </div>
        <div className="mb-4 text-center text-gray-500">Kartica {currentIndex + 1} od {flashcards.length}</div>
        <button type="button" onClick={() => setIsFlipped((value) => !value)} className="relative h-96 w-full text-left" aria-label="Okreni flash karticu">
          <div className="absolute inset-0 flashcard">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {!isFlipped ? (
                <>
                  <h3 className="text-2xl font-bold mb-2">{currentCard.front}</h3>
                  <p className="text-gray-600">Klikni da okreneš karticu</p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mb-2">Odgovor</h3>
                  <p className="text-gray-800">{currentCard.back}</p>
                </>
              )}
            </div>
          </div>
        </button>
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => { if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); setIsFlipped(false); } }} disabled={currentIndex === 0} className="btn-outline">Prethodna</button>
            <button onClick={() => setIsFlipped((value) => !value)} className="btn-primary">{isFlipped ? 'Prikaži pitanje' : 'Prikaži odgovor'}</button>
            <button onClick={() => { if (currentIndex < flashcards.length - 1) { setCurrentIndex(currentIndex + 1); setIsFlipped(false); } }} disabled={currentIndex >= flashcards.length - 1} className="btn-outline">Sledeća</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={markDifficult} className={currentCard.difficult ? 'btn-outline bg-yellow-50' : 'btn-outline'}>{currentCard.difficult ? 'Obeleženo kao teško' : 'Teško'}</button>
            <button onClick={markLearned} className={currentCard.learned ? 'btn-outline bg-green-50' : 'btn-outline'}>{currentCard.learned ? 'Naučeno' : 'Obeleži kao naučeno'}</button>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-medium mb-3">Dodaj nove flash kartice</h3>
          <div className="space-y-4">
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Unesi temu za generisanje" className="input w-full" />
            <button onClick={() => void generateFromTopic()} disabled={isGenerating} className="btn-primary w-full">
              {isGenerating ? 'Generiše se...' : 'Generiši flash kartice'}
            </button>
            {generateError && <p className="text-sm text-red-500 mt-2">{generateError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
