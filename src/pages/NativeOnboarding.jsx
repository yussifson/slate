import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Layers, ArrowRight, ChevronRight, Zap, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/ui/Logo';
import { fetchCompanyBrandingFromDomain, cleanLogo } from '@/lib/companyDomainResolver';

export default function NativeOnboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [companyBranding, setCompanyBranding] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;
    fetchCompanyBrandingFromDomain().then(res => {
      if (active && res?.company?.name) {
        setCompanyBranding(res.company);
      }
    });
    return () => { active = false; };
  }, []);

  const companyName = companyBranding?.name || 'Slate';
  const customLogoUrl = cleanLogo(companyBranding?.logo_url || companyBranding?.logo_light_url);

  const slides = [
    {
      id: 'welcome',
      icon: customLogoUrl ? (
        <img src={customLogoUrl} alt={companyName} className="w-16 h-16 object-contain drop-shadow-md rounded-xl" />
      ) : (
        <Logo className="w-16 h-16 text-primary drop-shadow-md" />
      ),
      title: `Welcome to ${companyName}`,
      description: companyBranding?.tagline || (companyBranding?.name ? `Your unified digital operating workspace.` : 'The unified business operating system engineered for modern enterprises.'),
    },
    {
      id: 'features',
      icon: <Layers className="w-16 h-16 text-primary drop-shadow-md" />,
      title: companyBranding?.name ? `Tailored for ${companyBranding.name}` : 'Built for Scale',
      description: 'Connect your entire workforce with powerful tools, seamless integrations, and real-time insights.',
    },
    {
      id: 'security',
      icon: <ShieldCheck className="w-16 h-16 text-primary drop-shadow-md" />,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption and granular access controls keep your data safe and compliant.',
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
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden font-sans selection:bg-primary/20">
      {/* Dynamic Background Mesh Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-50" />
        <div className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-60" />
      </div>

      {/* Top Bar (Skip) */}
      <div className="relative z-10 w-full p-6 flex justify-end">
        {currentSlide < slides.length - 1 && (
          <button 
            onClick={handleComplete}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors tracking-wide px-4 py-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            Skip
          </button>
        )}
      </div>

      {/* Carousel Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 w-full max-w-[400px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Glassmorphism Icon Container */}
            <div className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.05)] border-[0.5px] border-black/5 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/60 to-white/10 dark:from-white/10 dark:to-transparent rounded-[2.5rem] pointer-events-none" />
              {slides[currentSlide].icon}
            </div>
            
            <h1 className="text-3xl font-black text-foreground tracking-[-0.03em] mb-5 leading-tight">
              {slides[currentSlide].title}
            </h1>
            
            <p className="text-[16px] font-medium text-muted-foreground leading-relaxed max-w-[300px]">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 w-full p-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))] flex flex-col gap-10 max-w-[400px] mx-auto">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2.5">
          {slides.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                idx === currentSlide ? 'w-8 bg-primary shadow-sm shadow-primary/30' : 'w-2 bg-primary/20 dark:bg-primary/30'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleNext}
          className="w-full h-[60px] rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[17px] shadow-[0_8px_20px_rgba(0,0,0,0.12)] dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
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
