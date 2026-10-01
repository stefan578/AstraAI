import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../utils/localStorage';
import { useNavigate } from 'react-router-dom';

console.log('Home component loaded');

const Home: React.FC = () => {
  const [userName] = useLocalStorage('userName', '');
  const [userSubjects] = useLocalStorage('userSubjects', '[]');
  const [recentConversations, setRecentConversations] = useState<Array<any>>([]);
  const [recentLessons, setRecentLessons] = useState<Array<any>>([]);
  const [flashcardCount, setFlashcardCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Load recent conversations from localStorage
    const convos = JSON.parse(localStorage.getItem('recentConversations') || '[]');
    setRecentConversations(convos);

    // Load recent lessons
    const lessons = JSON.parse(localStorage.getItem('recentLessons') || '[]');
    setRecentLessons(lessons);

    // Load flashcard count
    const flashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
    setFlashcardCount(flashcards.length);

    // Load quiz count
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    setQuizCount(quizzes.length);
  }, []);

  const parseSubjects = (subjectsStr: string) => {
    try {
      return JSON.parse(subjectsStr);
    } catch {
      return [];
    }
  };

  const subjects = parseSubjects(userSubjects);

  return (
    <div className="container min-h-[80vh] py-6">
      <div className="space-y-6">
        {/* Greeting */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">
            Zdravo, {userName || 'prijatelju'}! 👋
          </h2>
          <p className="text-gray-600">
            Spreman za danasnje učenje? Evo šta možeš da uradiš:
          </p>
        </div>

        {/* Today's learning */}
        <div className="card">
          <h3 className="font-medium mb-3">Danasnje učenje</h3>
          <div className="space-y-3">
            {subjects.map((subject: string, idx: number) => (
              <div key={idx} className="flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded mr-3"></div>
                <span>{subject}</span>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-gray-500 italic">
                Nema izabranih predmeta. Idite u podešavanja da ih dodate.
              </p>
            )}
          </div>
        </div>

        {/* Quick AI actions */}
        <div className="card">
          <h3 className="font-medium mb-3">Brze AI akcije</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="btn-outline w-full"
            >
              💬 Pitaj AI
            </button>
            <button
              onClick={() => {
                // TODO: Implement image upload flow
                alert('Funkcija za učenje iz slice se razvija');
              }}
              className="btn-outline w-full"
            >
              📸 Uči iz slice
            </button>
            <button
              onClick={() => {
                // TODO: Implement text input for lesson generation
                alert('Funkcija za učenje iz teksta se razvija');
              }}
              className="btn-outline w-full"
            >
              📝 Uči iz teksta
            </button>
            <button
              onClick={() => navigate('/flashcards')}
              className="btn-outline w-full"
            >
              🃏 Flesh kartice
            </button>
            <button
              onClick={() => navigate('/quiz')}
              className="btn-outline w-full"
            >
              📝 Kviz
            </button>
            <button
              onClick={() => {
                // TODO: Implement progress view
                alert('Funkcija za pregled napretka se razvija');
              }}
              className="btn-outline w-full"
            >
              📈 Moje statistike
            </button>
          </div>
        </div>

        {/* Recent conversations */}
        <div className="card">
          <h3 className="font-medium mb-3">Recentni razgovori</h3>
          {recentConversations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Još nemaš razgovora. Počni novi razgovor u sekciji Chat.
            </p>
          ) : (
            <div className="space-y-3">
              {recentConversations.slice(0, 3).map((conv: any) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    // TODO: Navigate to chat with this conversation
                    alert(`Otvaranje razgovora: ${conv.title || 'Bez naslova'}`);
                  }}
                  className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium">{conv.title || 'Bez naslova'}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(conv.timestamp || Date.now()).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {conv.preview || 'Nema preview'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent lessons */}
        <div className="card">
          <h3 className="font-medium mb-3">Recentne lekcije</h3>
          {recentLessons.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Još nemaš sačuvanih lekcija. Generiši lekciju iz chata ili slice.
            </p>
          ) : (
            <div className="space-y-3">
              {recentLessons.slice(0, 3).map((lesson: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => {
                    // TODO: Navigate to lesson view
                    alert(`Otvaranje lekcije: ${lesson.title || 'Bez naslova'}`);
                  }}
                  className="p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium">{lesson.title || 'Bez naslova'}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(lesson.timestamp || Date.now()).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {lesson.subject || 'Nepoznat predmet'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Flesh kartice</h3>
                <p className="text-sm text-gray-500">
                  Naučeno danas
                </p>
              </div>
              <div className="text-2xl font-bold">{flashcardCount}</div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Kvizovi</h3>
                <p className="text-sm text-gray-500">
                  Rešeno danas
                </p>
              </div>
              <div className="text-2xl font-bold">{quizCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;