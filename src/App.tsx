import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import Settings from './pages/Settings';
import { useLocalStorage } from './utils/localStorage';

function App() {
  const [onboardingCompleted] = useLocalStorage('onboardingCompleted', false);
  console.log('onboardingCompleted:', onboardingCompleted);

  return (
    <BrowserRouter>
      <div className="app" style={{border: '2px solid red', minHeight: '100vh'}}>
        {!onboardingCompleted ? (
          <Navigate replace to="/onboarding" />
        ) : (
          <>
            <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
            <BottomNav />
          </>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;