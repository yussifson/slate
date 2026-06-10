import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { powerSync } from '@/api/PowerSyncConnector';
import { useToast } from '@/components/ui/use-toast';

export default function DynamicWorkflow({ record, moduleDef, onStatusChange }) {
  const { toast } = useToast();

  // Simulated workflow states defined in the module config
  const workflow = moduleDef?.config?.workflow || ['Draft', 'In Review', 'Approved', 'Completed'];
  const currentStatus = record?.status || workflow[0];
  const currentIndex = workflow.indexOf(currentStatus);

  const handleTransition = async (nextStatus) => {
    try {
      // In reality, you'd check permissions here
      await powerSync.execute(
        `UPDATE dynamic_records SET status = ?, updated_date = ? WHERE id = ?`,
        [nextStatus, new Date().toISOString(), record.id]
      );
      toast({
        title: "Workflow Updated",
        description: `Record moved to ${nextStatus}`,
      });
      if (onStatusChange) onStatusChange(record.id, nextStatus);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update workflow status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 my-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        {workflow.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors
                  ${isCompleted ? 'bg-muted text-primary' : 
                    isCurrent ? 'bg-primary text-white ring-2 ring-primary/20' : 
                    'bg-muted text-muted-foreground'}`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : (idx + 1)}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isCurrent ? 'text-primary/90' : 'text-muted-foreground'}`}>
                  {step}
                </span>
              </div>
              {idx < workflow.length - 1 && (
                <div className={`w-10 h-0.5 ${idx < currentIndex ? 'bg-primary/30' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex space-x-2">
        {currentIndex < workflow.length - 1 && (
          <Button 
            size="sm" 
            onClick={() => handleTransition(workflow[currentIndex + 1])}
            className="bg-primary hover:bg-primary/90 text-white shadow-sm"
          >
            Advance to {workflow[currentIndex + 1]} <ArrowRight className="ml-2 w-3 h-3" />
          </Button>
        )}
        {currentIndex > 0 && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleTransition(workflow[currentIndex - 1])}
          >
            Revert
          </Button>
        )}
      </div>
    </div>
  );
}
