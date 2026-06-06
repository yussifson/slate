import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OnlineAssessments() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  const questions = [
    { text: "What is the primary purpose of React Hooks?", options: ["Managing CSS", "State and lifecycle in functional components", "Routing", "Database management"] },
    { text: "Which hook is used for side effects?", options: ["useState", "useReducer", "useEffect", "useMemo"] }
  ];

  const handleNext = () => {
    setSelectedOption(null);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStarted('finished');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto py-12 px-4">
      
      {!started && (
        <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-[var(--color-module-online)] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-display text-[var(--color-text-primary)] mb-2">Module 1 Final Assessment</h1>
          <p className="text-[var(--color-text-secondary)] mb-8">Test your knowledge on the foundational concepts covered in Module 1. You must score 80% to pass.</p>
          
          <div className="flex justify-center gap-8 mb-8 text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--color-text-tertiary)]"/> 15 Minutes</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--color-text-tertiary)]"/> {questions.length} Questions</div>
            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-[var(--color-text-tertiary)]"/> 1 Attempt Remaining</div>
          </div>

          <button onClick={() => setStarted(true)} className="px-8 py-3 bg-[var(--color-module-online)] text-white font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
            Start Assessment
          </button>
        </div>
      )}

      {started === true && (
        <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[var(--color-surface-1)] border-b border-[var(--color-border-subtle)] p-4 flex justify-between items-center">
            <div className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Question {currentQ + 1} of {questions.length}
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-error)]">
              <Clock className="w-4 h-4" /> 14:59
            </div>
          </div>
          
          <div className="p-8">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">{questions[currentQ].text}</h2>
            
            <div className="space-y-3">
              {questions[currentQ].options.map((opt, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full text-left p-4 rounded-[var(--radius-md)] border text-sm font-medium transition-colors ${selectedOption === idx ? 'bg-[var(--color-module-online)] text-white border-[var(--color-module-online)]' : 'bg-[var(--color-surface-0)] text-[var(--color-text-primary)] border-[var(--color-border-default)] hover:border-[var(--color-module-online)]'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-surface-1)] border-t border-[var(--color-border-subtle)] p-4 flex justify-end">
            <button 
              disabled={selectedOption === null}
              onClick={handleNext} 
              className="px-6 py-2 bg-[var(--color-module-online)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {currentQ === questions.length - 1 ? 'Submit Assessment' : 'Next Question'}
            </button>
          </div>
        </div>
      )}

      {started === 'finished' && (
        <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-[var(--color-success-subtle)] text-[var(--color-success)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 border-white">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-display text-[var(--color-text-primary)] mb-2">Congratulations!</h1>
          <p className="text-[var(--color-text-secondary)] mb-6">You passed the assessment with a score of 100%.</p>
          
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/o/student-dashboard')} className="px-6 py-2 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-medium rounded-[var(--radius-md)] hover:bg-[var(--color-surface-2)] transition-colors">
              Back to Dashboard
            </button>
            <button onClick={() => navigate('/o/certificates')} className="px-6 py-2 bg-[var(--color-module-online)] text-white font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
              View Certificate
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
