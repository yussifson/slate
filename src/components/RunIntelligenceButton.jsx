import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap, RefreshCw } from 'lucide-react';
import { useIntelligence } from '@/hooks/useIntelligence';
import { useCompany } from '@/hooks/useCompanyId';

export default function RunIntelligenceButton({ vertical }) {
  const { company } = useCompany();
  const effectiveVertical = vertical || company?.industry_type || null;
  const { runEngine, isRunning } = useIntelligence(effectiveVertical);

  return (
    <Button 
      variant="default" 
      size="sm" 
      className="gap-2.5 text-xs tracking-[0.04em] bg-primary text-white hover:bg-primary/90"
      onClick={() => runEngine(effectiveVertical)}
      disabled={isRunning}
    >
      {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
      {isRunning ? "Analyzing..." : "Run Intelligence"}
    </Button>
  );
}
