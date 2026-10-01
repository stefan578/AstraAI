import React, { useState } from 'react';
import { useLocalStorage } from '../utils/localStorage';
import { useNavigate } from 'react-router-dom';

const subjects = [
  'Matematika',
  'Fizika',
  'Hemija',
  'Biologija',
  'Istorija',
  'Geografija',
  'Srpski jezik',
  'Književnost',
  'Engleski jezik',
  'Informatika',
];

const Onboarding: React.FC = () => {
  alert('Onboarding component loaded');
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [learningPreference, setLearningPreference] = useState('');
  const [, setOnboardingCompleted] = useLocalStorage('onboardingCompleted', false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step === 0 && !name) return;
    if (step === 1 && !grade) return;
    if (step === 2 && selectedSubjects.length === 0) return;
    if (step === 3 && !learningPreference) return;

    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save user data
      localStorage.setItem('userName', name);
      localStorage.setItem('userGrade', grade);
      localStorage.setItem('userSubjects', JSON.stringify(selectedSubjects));
      localStorage.setItem('userLearningPreference', learningPreference);
      setOnboardingCompleted(true);
      navigate('/');
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubjectToggle = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const steps = [
    {
      title: 'Ko si ti?',
      content: 'Unesi svoje ime ili nadimak da bismo ti se mogli obratiti lično.',
      render: () => (
        <input
          type="text"
          placeholder="Unesi ime"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input w-full mb-4"
          autoFocus
        />
      ),
    },
    {
      title: 'Koji si razred?',
      content: 'Izaberi svoj trenutni razred kako bismo prilagodili sadržaj.',
      render: () => (
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="input w-full mb-4"
        >
          <option value="">Izaberi razred</option>
          {[...Array(12).keys()].map(i => i + 1).map(grade => (
            <option key={grade} value={grade.toString()}>{grade}. razred</option>
          ))}
        </select>
      ),
    },
    {
      title: 'Koi ti predmeti interesuju?',
      content: 'Izaberi predmete koje želiš da učiš ili koji su ti najteži.',
      render: () => (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => handleSubjectToggle(subject)}
              className={`btn-outline ${
                selectedSubjects.includes(subject) ? 'btn-primary' : ''
              } w-full`}
            >
              {subject}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Kako najradije učiš?',
      content: 'Izaberi svoj preferirani način učenja kako bismo prilagodili savete.',
      render: () => (
        <select
          value={learningPreference}
          onChange={(e) => setLearningPreference(e.target.value)}
          className="input w-full mb-4"
        >
          <option value="">Izaberi način učenja</option>
          <option value="vizuellno">Vizuellno (slike, diagrami, video)</option>
          <option value="audio">Audio (podcasts, objašnjenja)</option>
          <option value="читање">Čitanje (tekstualni sadržaj)</option>
          <option value="praktično">Praktično (vezbi, simulacije)</option>
          <option value="kombinovano">Kombinovano</option>
        </select>
      ),
    },
  ];

  return (
    <div className="container min-h-[80vh] py-6">
      <div className="card">
        <h2 className="mb-4 text-center">{steps[step].title}</h2>
        <p className="mb-6 text-center text-gray-600">{steps[step].content}</p>
        <div className="mb-8">{steps[step].render()}</div>
        <div className="flex justify-between">
          {step > 0 && (
            <button onClick={handleBack} className="btn-outline">
              Nazad
            </button>
          )}
          <button onClick={handleNext} className="btn-primary">
            {step === 3 ? 'Završi' : 'Dalje'}
          </button>
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">
          Korak {step + 1} od {steps.length}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;