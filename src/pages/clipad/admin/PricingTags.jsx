import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Building2, CheckCircle2, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { OrbitLoader } from '@/components/ui/orbit-loader';
import { Button } from '@/components/ui/button';

export default function PricingTags() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    setLoading(true);
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (!error) {
      setCompanies(data || []);
    }
    setLoading(false);
  }

  const handleUpdatePlan = async (companyId, newPlan) => {
    const { error } = await supabase.from('companies').update({ subscription_plan: newPlan }).eq('id', companyId);
    
    if (!error) {
      toast({
        title: "Plan Updated Successfully",
        description: `The company has been instantly upgraded to the ${newPlan} plan.`
      });
      fetchCompanies();
    } else {
      toast({
        title: "Failed to update plan",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><OrbitLoader /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing & Plans</h1>
          <p className="text-muted-foreground mt-2">Manage and instantly update the subscription plans for all registered companies.</p>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead>Active Plan</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                    <Building2 className="w-4 h-4" />
                  </div>
                  {company.name}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${company.status === 'suspended' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {company.status || 'Active'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="capitalize px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-sm font-semibold">
                    {company.subscription_plan || 'starter'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        Change Plan <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUpdatePlan(company.id, 'starter')} className="cursor-pointer">
                        Starter (Free) {(!company.subscription_plan || company.subscription_plan === 'starter') && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdatePlan(company.id, 'pro')} className="cursor-pointer font-medium text-blue-600 dark:text-blue-400">
                        Pro Plan {company.subscription_plan === 'pro' && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdatePlan(company.id, 'enterprise')} className="cursor-pointer font-bold text-indigo-600 dark:text-indigo-400">
                        Enterprise {company.subscription_plan === 'enterprise' && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No companies found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
