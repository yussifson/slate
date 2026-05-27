import { Briefcase, ArrowRight, MapPin, Users, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Careers() {
  const jobs = [
    { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'San Francisco (Hybrid)', type: 'Full-time' },
    { title: 'Product Marketing Manager', department: 'Marketing', location: 'Remote (US)', type: 'Full-time' },
    { title: 'Enterprise Account Executive', department: 'Sales', location: 'London (Hybrid)', type: 'Full-time' },
    { title: 'Customer Success Specialist', department: 'Support', location: 'Remote (Global)', type: 'Full-time' }
  ];

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto min-h-screen">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold mb-6">
          <Briefcase className="w-4 h-4" /> We're Hiring
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          Help us build the future of work
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed">
          Join our global team of problem solvers, builders, and innovators passionate about creating the ultimate business operating system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
          <Users className="w-10 h-10 text-blue-600 mb-6" />
          <h3 className="text-xl font-bold text-slate-900 mb-3">Global Team</h3>
          <p className="text-slate-600">Work with talented people from over 20 different countries in a remote-first culture.</p>
        </div>
        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
          <Zap className="w-10 h-10 text-amber-500 mb-6" />
          <h3 className="text-xl font-bold text-slate-900 mb-3">Impact</h3>
          <p className="text-slate-600">Build software that empowers thousands of businesses to operate more efficiently.</p>
        </div>
        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
          <Heart className="w-10 h-10 text-rose-500 mb-6" />
          <h3 className="text-xl font-bold text-slate-900 mb-3">Benefits</h3>
          <p className="text-slate-600">Comprehensive health, wellness, and learning stipends to support your best self.</p>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-8">Open Positions</h2>
        <div className="space-y-4">
          {jobs.map((job, idx) => (
            <div key={idx} className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{job.title}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                  <span className="bg-slate-100 px-3 py-1 rounded-full">{job.department}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                  <span>{job.type}</span>
                </div>
              </div>
              <Button variant="outline" className="shrink-0 rounded-full group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-all">
                Apply Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
