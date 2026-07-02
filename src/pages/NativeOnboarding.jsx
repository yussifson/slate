import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Layers, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/ui/Logo';

export default function NativeOnboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const slides = [
    {
      id: 'welcome',
      icon: <Logo className="w-20 h-20 text-primary" />,
      title: 'Welcome to Slate',
      description: 'The unified business operating system engineered for modern enterprises.',
      color: 'from-blue-500/20 to-indigo-500/20',
      iconBg: 'bg-white',
    },
    {
      id: 'features',
      icon: <Layers className="w-10 h-10 text-indigo-600" />,
      title: 'Built for Scale',
      description: 'Connect your entire workforce with powerful tools, seamless integrations, and real-time insights.',
      color: 'from-indigo-500/20 to-purple-500/20',
      iconBg: 'bg-indigo-50',
    },
    {
      id: 'security',
      icon: <Shield className="w-10 h-10 text-emerald-600" />,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption and granular access controls keep your data safe and compliant.',
      color: 'from-purple-500/20 to-emerald-500/20',
      iconBg: 'bg-emerald-50',
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('slate_has_seen_onboarding', 'true');
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].color} opacity-40 transition-colors duration-700`} />
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Bar (Skip) */}
      <div className="relative z-10 w-full p-6 flex justify-end">
        {currentSlide < slides.length - 1 && (
          <button 
            onClick={handleComplete}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors tracking-wide"
          >
            Skip
          </button>
        )}
      </div>

      {/* Carousel Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center text-center w-full"
          >
            <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center mb-10 shadow-sm border border-black/5 ${slides[currentSlide].iconBg}`}>
              {slides[currentSlide].icon}
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              {slides[currentSlide].title}
            </h1>
            
            <p className="text-[15px] font-medium text-slate-500 leading-relaxed max-w-[280px]">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 w-full p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] flex flex-col gap-8 max-w-md mx-auto">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-6 bg-primary' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleNext}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold text-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group"
        >
          {currentSlide === slides.length - 1 ? (
            <>
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
