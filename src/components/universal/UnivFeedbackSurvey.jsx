import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { MessageSquareHeart, Star, User, Calendar, MessageCircle, AlertCircle} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivFeedbackSurvey = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [feedbacks, setFeedbacks] = useState([]);
 const [loading, setLoading] = useState(true);
 const [formData, setFormData] = useState({
 respondent_name: '',
 service_used: '',
 rating: 5,
 comments: '',
 survey_date: new Date().toISOString().slice(0, 10),
 follow_up_required: false
});

 useEffect(() => {
 fetchFeedbacks();
}, []);

 const fetchFeedbacks = async () => {
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_feedbacksurvey WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setFeedbacks(data || []);
} catch (error) {
 console.error('Error fetching feedback:', error);
} finally {
 setLoading(false);
}
};

 const handleChange = (e) => {
 const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
 setFormData({ ...formData, [e.target.name]: value});
};

 const handleSubmit = async (e) => {
 e.preventDefault();
 try {
 const { error} = await (async () => {
 const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_feedbacksurvey (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
 if (error) throw error;
 setFormData({
 respondent_name: '',
 service_used: '',
 rating: 5,
 comments: '',
 survey_date: new Date().toISOString().slice(0, 10),
 follow_up_required: false
});
 fetchFeedbacks();
} catch (error) {
 console.error('Error adding feedback:', error);
}
};

 const renderStars = (rating) => {
 return Array(5).fill(0).map((_, i) => (
 <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
 ));
};

 return (
 <div className="p-6 max-w-6xl mx-auto bg-pink-50/30 min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-10 text-center">
 <h1 className="text-4xl font-extrabold text-foreground flex items-center justify-center gap-3">
 <MessageSquareHeart className="w-10 h-10 text-pink-500" />
 Customer Voice
 </h1>
 <p className="text-muted-foreground mt-2">Collect and analyze service feedback</p>
 </motion.div>

 <div className="view-header grid md:grid-cols-3 gap-8">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="md:col-span-1 bg-card p-6 rounded-3xl border border-pink-100">
 <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
 <MessageCircle className="w-5 h-5 text-pink-500" /> New Survey
 </h2>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Name (Optional)</label>
 <div className="relative">
 <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
 <input type="text" name="respondent_name" value={formData.respondent_name} onChange={handleChange} placeholder="Anonymous" className="w-full pl-9 p-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition-all" />
 </div>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Service/Product Used</label>
 <input type="text" name="service_used" value={formData.service_used} onChange={handleChange} required className="w-full p-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition-all" />
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Rating (1-5)</label>
 <input type="range" min="1" max="5" name="rating" value={formData.rating} onChange={handleChange} className="w-full accent-pink-500" />
 <div className="flex justify-between text-xs text-muted-foreground font-medium px-1 mt-1">
 <span>Poor</span><span>Excellent</span>
 </div>
 <div className="flex justify-center gap-1 mt-2">{renderStars(formData.rating)}</div>
 </div>
 <div>
 <label className="block text-sm font-semibold text-foreground mb-1">Comments</label>
 <textarea name="comments" value={formData.comments} onChange={handleChange} rows="3" required className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition-all"></textarea>
 </div>
 <div className="flex items-center gap-2 p-3 bg-background rounded-xl border border-border">
 <input type="checkbox" id="follow_up" name="follow_up_required" checked={formData.follow_up_required} onChange={handleChange} className="w-4 h-4 text-pink-500 rounded border-border focus:ring-pink-500" />
 <label htmlFor="follow_up" className="text-sm font-medium text-foreground cursor-pointer">Requires follow-up</label>
 </div>
 <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-all mt-2">
 Submit Feedback
 </button>
 </form>
 </motion.div>

 <div className="md:col-span-2 space-y-4">
 {loading ? (
 <div className="text-center py-20"><MessageSquareHeart className="w-10 h-10 text-pink-400 animate-pulse mx-auto" /></div>
 ) : feedbacks.length === 0 ? (
 <div className="text-center py-20 bg-card rounded-3xl border border-border text-muted-foreground">No feedback received yet.</div>
 ) : (
 <div className="grid sm:grid-cols-2 gap-4">
 {feedbacks.map((fb, index) => (
 <motion.div key={fb.id || index} initial={{ opacity: 0, scale: 0.95}} animate={{ opacity: 1, scale: 1}} transition={{ delay: index * 0.05}} className="bg-card p-5 rounded-3xl border border-border relative group hover:border-pink-200 transition-colors">
 {fb.follow_up_required && (
 <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full " title="Requires Follow-up">
 <AlertCircle className="w-4 h-4" />
 </div>
 )}
 <div className="flex justify-between items-start mb-3">
 <div className="flex gap-1">{renderStars(fb.rating)}</div>
 <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/>{fb.survey_date}</span>
 </div>
 
 <p className="text-foreground text-sm mb-4 italic line-clamp-3">"{fb.comments}"</p>
 
 <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
 <span className="font-semibold text-foreground">{fb.respondent_name || 'Anonymous'}</span>
 <span className="bg-muted text-muted-foreground px-2 py-1 rounded-md font-medium truncate max-w-[120px]">{fb.service_used}</span>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default UnivFeedbackSurvey;
