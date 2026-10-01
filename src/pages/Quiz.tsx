import React, { useState, useEffect } from 'react';
import { useAI } from '../hooks/useAI';

const Quiz: React.FC = () => {
  const {
    aiService,
    generateQuiz,
  } = useAI();
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // index
    explanation?: string;
  }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>([]); // selected answer index per question
  const [showResult, setShowResult] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize answers array when quiz changes
    if (quiz.length > 0) {
      setAnswers(Array(quiz.length).fill(null));
    }
  }, [quiz.length]);

  const generateFromTopic = async () => {
    if (!topic.trim()) {
      setGenerateError('Molimo unesite temu za generisanje kviza.');
      return;
    }
    if (!aiService) {
      setGenerateError('AI servis nije disponibilan. Proveri podešavanja.');
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const newQuiz = await generateQuiz(topic, 5); // Generate 5 questions
      // Add IDs to questions
      const quizWithIds = newQuiz.map((q, idx) => ({
        id: `q${idx}`,
        ...q,
      }));
      setQuiz(quizWithIds);
      setCurrentQuestion(0);
      setAnswers(Array(newQuiz.length).fill(null));
      setShowResult(false);
      setTopic('');
    } catch (err) {
      console.error('Error generating quiz:', err);
      setGenerateError('Došlo je do greške pri generisanju kviza.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    const updated = [...answers];
    updated[questionIndex] = optionIndex;
    setAnswers(updated);
    // Auto-advance to next question if not last
    if (questionIndex < quiz.length - 1) {
      setCurrentQuestion(questionIndex + 1);
    }
  };

  const calculateScore = () => {
    if (quiz.length === 0) return 0;
    let correct = 0;
    quiz.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.length) * 100);
  };

  const reviewAnswers = () => {
    setShowResult(true);
  };

  const retakeQuiz = () => {
    setCurrentQuestion(0);
    setAnswers(Array(quiz.length).fill(null));
    setShowResult(false);
  };

  const clearQuiz = () => {
    setQuiz([]);
    setTopic('');
  };

  if (quiz.length === 0) {
    return (
      <div className="container min-h-[80vh] py-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Kviz</h2>
          <p className="text-gray-600 mb-6">
            Još nemate kviz za rešavanje. Generiši kviz iz teme.
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
              {isGenerating ? 'Generiše se...' : 'Generiši kviz'}
            </button>
            {generateError && (
              <p className="text-sm text-red-500 mt-2">{generateError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const score = calculateScore();
    return (
      <div className="container min-h-[80vh] py-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Rezultat kviza</h2>
          <div className="text-5xl font-bold text-center mb-4 {
            score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'
          }">
            {score}%
          </div>
          <p className="text-center mb-6">
            Tacno {quiz.filter((_, i) => answers[i] === quiz[i].correctAnswer).length} od {quiz.length} pitanja
          </p>
          <div className="mt-6">
            <h3 className="font-medium mb-4">Pregled odgovora</h3>
            {quiz.map((q, idx) => (
              <div key={q.id} className="mb-4 p-3 border rounded">
                <div className="font-medium mb-2">Pitanje {idx + 1}: {q.question}</div>
                <div className="mb-2">Vaš odgovor: {
                  answers[idx] !== null
                    ? q.options[answers[idx]]
                    : 'Nije odgovoreno'
                } {answers[idx] !== null && answers[idx] !== q.correctAnswer ? '(netačno)' : ''}</div>
                <div className="mb-2">Tacan odgovor: {q.options[q.correctAnswer]}</div>
                {q.explanation && (
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                    <strong>Objašnjenje:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={retakeQuiz}
              className="btn-outline mr-3"
            >
              Ponovi kviz
            </button>
            <button
              onClick={clearQuiz}
              className="btn-outline"
            >
              Novi kviz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display current question
  const currentQ = quiz[currentQuestion];

  return (
    <div className="container min-h-[80vh] py-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Kviz</h2>
        <div className="mb-4 flex justify-between items-center">
          <span>Pitanje {currentQuestion + 1} od {quiz.length}</span>
          <span className="text-gray-500">Napredak: {Math.round(((currentQuestion + 1) / quiz.length) * 100)}%</span>
        </div>
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <p className="font-medium mb-3">{currentQ.question}</p>
          {currentQ.options.map((option, idx) => (
            <div
              key={idx}
              onClick={() => selectAnswer(currentQuestion, idx)}
              className={`option cursor-pointer p-3 mb-2 border rounded ${
                answers[currentQuestion] === idx
                  ? 'bg-blue-50 border-blue-500'
                  : ''
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{String.fromCharCode(65 + idx)}.</span>
                <span>{option}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="btn-outline"
          >
            Nazad
          </button>
          <button
            onClick={() => {
              if (currentQuestion < quiz.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
              } else {
                reviewAnswers();
              }
            }}
            className="btn-primary"
          >
            {currentQuestion < quiz.length - 1 ? 'Sledeće' : 'Završi i pogledaj rezultat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;