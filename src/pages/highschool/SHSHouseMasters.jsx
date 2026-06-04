import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Shield, Users, Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SHSHouseMasters() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [houses, setHouses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [houseData, teacherData] = await Promise.all([
          base44.getEntities('shs_house', user?.company_id),
          base44.getEntities('shs_teacher', user?.company_id)
        ]);
        setHouses(houseData);
        setTeachers(teacherData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company_id) {
      fetchData();
    }
  }, [user]);

  // Find teachers who are house masters
  const houseMasters = houses.map(house => {
    if (!house.data?.houseMasterId) return null;
    const master = teachers.find(t => t.id === house.data.houseMasterId);
    return {
      houseId: house.id,
      houseName: house.title,
      houseColor: house.data?.color || '#6F00FF',
      ...master
    };
  }).filter(m => m && m.id);

  const filteredMasters = houseMasters.filter(m => 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.houseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            House Masters Directory
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Contact directory for boarding house masters and mistresses.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Assigned Masters</CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search master or house..." 
                className="pl-9 h-9 bg-white border-slate-200 rounded-xl focus-visible:ring-[#6F00FF]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading directory...</div>
          ) : filteredMasters.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 mx-auto flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No House Masters Assigned</h3>
              <p className="text-sm text-slate-500">Go to Boarding Houses to assign masters to houses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredMasters.map(master => (
                <div key={master.id} className="relative group p-6 rounded-3xl border border-slate-100 bg-white hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 w-full h-2" 
                    style={{ backgroundColor: master.houseColor }}
                  ></div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-400">
                      {master.title.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">{master.title}</h4>
                      <Badge variant="outline" className="mt-1 border-none shadow-sm text-white" style={{ backgroundColor: master.houseColor }}>
                        {master.houseName} Master
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    {master.data?.email && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{master.data.email}</span>
                      </div>
                    )}
                    {master.data?.phone && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{master.data.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-50 flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl font-semibold text-slate-600 hover:text-[#6F00FF] hover:bg-purple-50 hover:border-purple-200">
                      Send Message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
