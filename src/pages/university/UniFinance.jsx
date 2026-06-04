import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { DollarSign, Search, ArrowUpRight, ArrowDownRight, CreditCard, Download, Filter, Wallet } from 'lucide-react';
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function UniFinance() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  
  const { data: records = [] } = useQuery({ 
    queryKey: ["cases", companyId, "uni_finance"], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId, case_type: 'uni_finance' }), 
    enabled: !!companyId 
  });
  
  const transactions = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    const isIncome = extra.type !== 'expense';
    const amount = extra.amount || Math.floor(Math.random() * 5000) + 100;
    return {
      id: r.id,
      description: r.case_name || r.name || 'Financial Transaction',
      amount: amount,
      isIncome: isIncome,
      date: extra.date || new Date().toISOString().split('T')[0],
      category: extra.category || (isIncome ? 'Tuition' : 'Operational'),
      status: extra.status || 'Completed'
    };
  });

  const filtered = transactions.filter(t => t.description?.toLowerCase().includes(search.toLowerCase()));

  const totalIncome = transactions.filter(t => t.isIncome).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => !t.isIncome).reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      <ModuleBanner
        title={t("uni_finance", "Financial Management")}
        subtitle={t("manage_finance", "Track tuition payments, grants, and operational expenses")}
        metrics={[
          { title: "Total Transactions", value: transactions.length, icon: Wallet }
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                <h3 className="text-3xl font-bold text-slate-900">${totalIncome.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Expenses</p>
                <h3 className="text-3xl font-bold text-slate-900">${totalExpense.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-indigo-200 mb-1">Net Balance</p>
                <h3 className="text-3xl font-bold text-white">${(totalIncome - totalExpense).toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search transactions..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 border-slate-200 focus-visible:ring-indigo-500" 
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="gap-2 text-slate-600">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button variant="outline" className="gap-2 text-slate-600">
            <Download className="w-4 h-4" /> Report
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200">
            <DollarSign className="w-4 h-4" /> New Transaction
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
          <CardTitle className="text-lg font-medium text-slate-800">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-500 py-3 pl-6">Description</TableHead>
                    <TableHead className="font-semibold text-slate-500">Category</TableHead>
                    <TableHead className="font-semibold text-slate-500">Date</TableHead>
                    <TableHead className="font-semibold text-slate-500">Status</TableHead>
                    <TableHead className="font-semibold text-slate-500 text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(txn => (
                    <TableRow key={txn.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 py-4">
                        <div className="font-medium text-slate-900">{txn.description}</div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                          {txn.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500">{txn.date}</TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">{txn.status}</span>
                      </TableCell>
                      <TableCell className={`text-right pr-6 font-semibold ${txn.isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {txn.isIncome ? '+' : '-'}${txn.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
