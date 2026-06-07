import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Save, CheckCircle2, SlidersHorizontal, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SHSAssessment() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [assessmentConfig, setAssessmentConfig] = useState({
    classWorkWeight: 30,
    examWeight: 70,
    gradingSystem: 'WAEC Standard (A1-F9)',
    passMark: 40,
    enableContinuousAssessment: true
  });

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const records = await base44.getEntities('shs_assessment_config', user?.company_id);
        if (records.length > 0) {
          const config = records[0];
          setSettingsId(config.id);
          if (config.data) {
            setAssessmentConfig({
              ...assessmentConfig,
              ...config.data
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch assessment config:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company_id) {
      fetchConfig();
    }
  }, [user]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_assessment_config',
        title: 'Global Assessment Configuration',
        case_number: 'CFG-ASSESS',
        status: 'Active',
        data: assessmentConfig
      };

      if (settingsId) {
        await base44.updateEntity(settingsId, payload);
      } else {
        const res = await base44.createEntity(payload);
        setSettingsId(res.id);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save assessment config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWeightChange = (field, value) => {
    const num = Math.min(100, Math.max(0, parseInt(value) || 0));
    if (field === 'classWorkWeight') {
      setAssessmentConfig({
        ...assessmentConfig,
        classWorkWeight: num,
        examWeight: 100 - num
      });
    } else {
      setAssessmentConfig({
        ...assessmentConfig,
        examWeight: num,
        classWorkWeight: 100 - num
      });
    }
    setSaveSuccess(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
            Assessment Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Configure global grading scales and continuous assessment weights.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Config */}
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Scoring Formula</CardTitle>
                <CardDescription>Adjust the ratio between classwork and exams</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {loading ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">Loading settings...</div>
            ) : (
              <div className="space-y-8 max-w-xl">
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Class/Continuous Assessment Weight</label>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-xl">{assessmentConfig.classWorkWeight}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    className="w-full h-2 bg-emerald-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    value={assessmentConfig.classWorkWeight}
                    onChange={(e) => handleWeightChange('classWorkWeight', e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Final Exam Weight</label>
                    <span className="font-black text-emerald-600 text-xl">{assessmentConfig.examWeight}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    value={assessmentConfig.examWeight}
                    onChange={(e) => handleWeightChange('examWeight', e.target.value)}
                  />
                </div>
                
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Grading Scale</label>
                    <select 
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 font-semibold text-slate-700 dark:text-slate-200"
                      value={assessmentConfig.gradingSystem}
                      onChange={(e) => {
                        setAssessmentConfig({...assessmentConfig, gradingSystem: e.target.value});
                        setSaveSuccess(false);
                      }}
                    >
                      <option value="WAEC Standard (A1-F9)">WAEC Standard (A1-F9)</option>
                      <option value="GPA (4.0 Scale)">GPA (4.0 Scale)</option>
                      <option value="Percentage Only">Percentage Only</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pass Mark (%)</label>
                    <Input 
                      type="number"
                      min="0" max="100"
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 font-semibold text-slate-700 dark:text-slate-200"
                      value={assessmentConfig.passMark}
                      onChange={(e) => {
                        setAssessmentConfig({...assessmentConfig, passMark: parseInt(e.target.value) || 0});
                        setSaveSuccess(false);
                      }}
                    />
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <div>
                    {saveSuccess && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1.5 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" /> Settings Saved
                      </Badge>
                    )}
                  </div>
                  <Button 
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="h-11 px-8 rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 font-bold"
                  >
                    {isSaving ? 'Saving...' : (
                      <><Save className="w-4 h-4 mr-2" /> Save Configuration</>
                    )}
                  </Button>
                </div>

              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white overflow-hidden">
          <CardHeader className="border-b border-white/10 pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-200 dark:text-emerald-800" /> System Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <h4 className="font-bold text-emerald-100 dark:text-emerald-900">Grade Computation</h4>
              <p className="text-sm text-emerald-200 dark:text-emerald-800/80 leading-relaxed">
                These settings directly affect how report cards are generated. The total score for any subject will be calculated using the {assessmentConfig.classWorkWeight}/{assessmentConfig.examWeight} ratio specified here.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold text-emerald-100 dark:text-emerald-900">Grading System ({assessmentConfig.gradingSystem})</h4>
              <div className="bg-black/20 rounded-xl p-4 text-xs space-y-2">
                {assessmentConfig.gradingSystem === 'WAEC Standard (A1-F9)' ? (
                  <>
                    <div className="flex justify-between"><span className="text-emerald-200 dark:text-emerald-800">80 - 100</span><strong className="text-emerald-400">A1 (Excellent)</strong></div>
                    <div className="flex justify-between"><span className="text-emerald-200 dark:text-emerald-800">70 - 79</span><strong className="text-emerald-400">B2 (Very Good)</strong></div>
                    <div className="flex justify-between"><span className="text-emerald-200 dark:text-emerald-800">65 - 69</span><strong className="text-emerald-400">B3 (Good)</strong></div>
                    <div className="flex justify-between"><span className="text-emerald-200 dark:text-emerald-800">60 - 64</span><strong className="text-amber-400">C4 (Credit)</strong></div>
                    <div className="flex justify-between"><span className="text-emerald-200 dark:text-emerald-800">55 - 59</span><strong className="text-amber-400">C5 (Credit)</strong></div>
                    <div className="flex justify-between"><span className="text-emerald-200 dark:text-emerald-800">50 - 54</span><strong className="text-amber-400">C6 (Credit)</strong></div>
                    <div className="flex justify-between"><span className="text-emerald-200 dark:text-emerald-800">45 - 49</span><strong className="text-orange-400">D7 (Pass)</strong></div>
                    <div className="flex justify-between"><span className="text-emerald-200 dark:text-emerald-800">40 - 44</span><strong className="text-orange-400">E8 (Pass)</strong></div>
                    <div className="flex justify-between"><span className="text-emerald-200 dark:text-emerald-800">0 - 39</span><strong className="text-rose-400">F9 (Fail)</strong></div>
                  </>
                ) : (
                  <div className="text-emerald-200 dark:text-emerald-800 text-center py-2">Preview not available for this scale.</div>
                )}
              </div>
            </div>
            
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
