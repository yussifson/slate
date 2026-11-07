import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Layers, ArrowRight, ChevronRight, Building2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
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

  const companyName = companyBranding?.name || 'JCL Office';
  const customLogoUrl = cleanLogo(companyBranding?.logo_url || companyBranding?.logo_light_url) || '/jcl-logo.png';

  const slides = [
    {
      id: 'welcome',
      icon: (
        <img 
          src={customLogoUrl} 
          alt={companyName} 
          className="w-20 h-20 object-contain drop-shadow-sm select-none" 
        />
      ),
      title: 'Welcome to JCL Office',
      description: 'Your premier real estate operations, property management, and enterprise collaborative workspace.'
    },
    {
      id: 'features',
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Layers className="w-9 h-9" strokeWidth={2.2} />
        </div>
      ),
      title: 'Tailored for Real Estate',
      description: 'Manage listings, clients, leases, maintenance, engineering, and finance in one synchronized system.'
    },
    {
      id: 'security',
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
          <ShieldCheck className="w-9 h-9" strokeWidth={2.2} />
        </div>
      ),
      title: 'Enterprise Trust & Security',
      description: 'Granular role-based controls, audit security logs, and bank-grade data encryption at every step.'
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
    <div className="fixed inset-0 z-50 bg-[#F8F9FA] dark:bg-[#0B1418] flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* Background Subtle Accent Gradients (No heavy blurs) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[15%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-primary/[0.07] dark:bg-primary/[0.12] blur-[80px]" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[80vw] h-[80vw] rounded-full bg-blue-500/[0.06] dark:bg-blue-500/[0.10] blur-[80px]" />
      </div>

      {/* Top Bar: Skip Action */}
      <div className="relative z-20 w-full px-6 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/jcl-logo.png" alt="JCL Office" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-sm tracking-tight text-foreground">JCL OFFICE</span>
        </div>
        {currentSlide < slides.length - 1 ? (
          <button 
            onClick={handleComplete}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground tracking-wide px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 active:scale-95 transition-all"
          >
            Skip
          </button>
        ) : <div />}
      </div>

      {/* Carousel Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 w-full max-w-[380px] mx-auto text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Crisp Native Container */}
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8 bg-white dark:bg-[#151E28] border border-black/5 dark:border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
              {slides[currentSlide].icon}
            </div>
            
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-3 leading-snug">
              {slides[currentSlide].title}
            </h1>
            
            <p className="text-[15px] font-normal text-muted-foreground leading-relaxed max-w-[320px]">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-20 w-full px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex flex-col gap-6 max-w-[380px] mx-auto">
        
        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-7 bg-primary' : 'w-2 bg-black/15 dark:bg-white/20'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Buttons Stack */}
        <div className="flex flex-col gap-2.5 w-full">
          <Button 
            onClick={handleNext}
            className="w-full h-[52px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[16px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {currentSlide === slides.length - 1 ? (
              <>
                Sign In to Workspace
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {currentSlide < slides.length - 1 && (
            <Button
              variant="ghost"
              onClick={handleComplete}
              className="w-full h-[44px] rounded-xl text-muted-foreground font-semibold text-[14px] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
