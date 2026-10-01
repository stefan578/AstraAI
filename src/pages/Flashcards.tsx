import React, { useState, useEffect } from 'react';
import { useAI } from '../hooks/useAI';
import { useLocalStorage } from '../utils/localStorage';

const Flashcards: React.FC = () => {
  const {
    aiService,
    generateFlashcards,
  } = useAI();
  const [flashcards, setFlashcards] = useLocalStorage('flashcards', [] as Array<{
    id: string;
    front: string;
    back: string;
    difficult: boolean;
    learned: boolean;
  }>);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize shuffled indices
    const indices = Array.from({ length: flashcards.length }, (_, i) => i);
    setShuffledIndices(indices);
  }, [flashcards.length]);

  const resetShuffle = () => {
    const indices = Array.from({ length: flashcards.length }, (_, i) => i);
    // Shuffle array
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const markDifficult = () => {
    if (flashcards.length === 0) return;
    const updated = [...flashcards];
    const actualIndex = shuffledIndices[currentIndex];
    updated[actualIndex] = {
      ...updated[actualIndex],
      difficult: !updated[actualIndex].difficult,
    };
    setFlashcards(updated);
  };

  const markLearned = () => {
    if (flashcards.length === 0) return;
    const updated = [...flashcards];
    const actualIndex = shuffledIndices[currentIndex];
    updated[actualIndex] = {
      ...updated[actualIndex],
      learned: true,
    };
    setFlashcards(updated);
    // Move to next card if exists
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const nextCard = () => {
    if (flashcards.length === 0) return;
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // End of deck, reset or show message
      alert('Stigli ste do kraja spiska. Možete da ponovite shuffle.');
    }
  };

  const prevCard = () => {
    if (flashcards.length === 0) return;
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    } else {
      alert('Ovo je prva kartica.');
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const generateFromTopic = async () => {
    if (!topic.trim()) {
      setGenerateError('Molimo unesite temu za generisanje flesh kartica.');
      return;
    }
    if (!aiService) {
      setGenerateError('AI servis nije disponibilan. Proveri podešavanja.');
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const newCards = await generateFlashcards(topic);
      // Add to existing flashcards
      const updated = [...flashcards, ...newCards.map(card => ({
        id: Math.random().toString(36).substr(2, 9),
        front: card.front,
        back: card.back,
        difficult: false,
        learned: false,
      }))];
      setFlashcards(updated);
      resetShuffle();
      setTopic('');
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setGenerateError('Došlo je do greške pri generisanju flesh kartica.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    if (window.confirm('Da li ste sigurni da želite da obrišete sve flesh kartice?')) {
      setFlashcards([]);
      resetShuffle();
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="container min-h-[80vh] py-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Flesh kartice</h2>
          <p className="text-gray-600 mb-6">
            Još nemate flesh kartice. Generiši ih iz teme ili sačuvaj ih iz chata/lektira.
          </p>
          <div className="space-y-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Unesi temu (npr. Pitagorina teorema)"
              className="input w-full"
            />
            <button
              onClick={generateFromTopic}
              disabled={isGenerating}
              className="btn-primary w-full"
            >
              {isGenerating ? 'Generiše se...' : 'Generiši flesh kartice'}
            </button>
            {generateError && (
              <p className="text-sm text-red-500 mt-2">{generateError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[shuffledIndices[currentIndex]];

  return (
    <div className="container min-h-[80vh] py-6">
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Flesh kartice</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={resetShuffle}
              className="btn-outline"
            >
              Shuffle
            </button>
            <button
              onClick={clearAll}
              className="btn-outline text-red-500"
            >
              Obriši sve
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4 text-center text-gray-500">
          Kartica {currentIndex + 1} od {flashcards.length}
        </div>

        {/* Flashcard */}
        <div className="relative h-96">
          <div
            className={`absolute inset-0 flashcard transition-transform duration-500 ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              {!isFlipped ? (
                <>
                  <h3 className="text-2xl font-bold mb-2">{currentCard.front}</h3>
                  <p className="text-gray-600">Kliknite da prevedete</p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mb-2">Odgovor</h3>
                  <p className="text-gray-800">{currentCard.back}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={prevCard}
              disabled={currentIndex === 0 || flashcards.length === 0}
              className="btn-outline"
            >
              Prethodna
            </button>
            <button
              onClick={flipCard}
              className="btn-primary"
            >
              {isFlipped ? 'Prednji strane' : 'Obrnite karticu'}
            </button>
            <button
              onClick={nextCard}
              disabled={currentIndex >= flashcards.length - 1 || flashcards.length === 0}
              className="btn-outline"
            >
              Sledeća
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={markDifficult}
              className={`btn-outline ${
                currentCard.difficult ? 'bg-yellow-50' : ''
              }`}
            >
              {currentCard.difficult ? 'Obeleženo kao teško' : 'Teško'}
            </button>
            <button
              onClick={markLearned}
              className={`btn-outline ${
                currentCard.learned ? 'bg-green-50' : ''
              }`}
            >
              {currentCard.learned ? 'Naučeno' : 'Obeleži kao naučeno'}
            </button>
          </div>
        </div>

        {/* Add new flashcards section */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-medium mb-3">Dodaj nove flesh kartice</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Unesi temu za generisanje"
              className="input w-full"
            />
            <button
              onClick={generateFromTopic}
              disabled={isGenerating}
              className="btn-primary w-full"
            >
              {isGenerating ? 'Generiše se...' : 'Generiši flesh kartice'}
            </button>
            {generateError && (
              <p className="text-sm text-red-500 mt-2">{generateError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;