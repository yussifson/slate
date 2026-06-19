import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';
import { motion} from 'framer-motion';
import { Star, BedDouble, User, Calendar, Sparkles, ThumbsUp} from 'lucide-react';

import { supabase} from "@/api/supabaseClient";

const UnivHotelReview = () => {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [reviews, setReviews] = useState([]);
 const [loading, setLoading] = useState(true);
 const [formData, setFormData] = useState({
 guest_name: '',
 room_type: 'Standard',
 stay_date: '',
 rating: 5,
 review_text: '',
 cleanliness_score: 5,
 service_score: 5
});

 useEffect(() => {
 fetchReviews();
}, []);

 const fetchReviews = async () => {
 try {
 const __res = await powerSync.execute(`SELECT * FROM univ_hotelreview WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const data = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (error) throw error;
 setReviews(data || []);
} catch (error) {
 console.error('Error fetching reviews:', error);
} finally {
 setLoading(false);
}
};

 const handleChange = (e) => {
 setFormData({ ...formData, [e.target.name]: e.target.value});
};

 const handleSubmit = async (e) => {
 e.preventDefault();
 try {
 const { error} = await (async () => {
 const _payload = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_hotelreview (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
 setFormData({
 guest_name: '',
 room_type: 'Standard',
 stay_date: '',
 rating: 5,
 review_text: '',
 cleanliness_score: 5,
 service_score: 5
});
 fetchReviews();
} catch (error) {
 console.error('Error adding review:', error);
}
};

 const renderStars = (rating) => {
 return Array(5).fill(0).map((_, i) => (
 <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
 ));
};

 return (
 <div className="p-6 max-w-7xl mx-auto bg-background min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <motion.div initial={{ opacity: 0, y: -20}} animate={{ opacity: 1, y: 0}} className="mb-10 flex flex-col items-center">
 <h1 className="text-4xl font-serif font-semibold text-foreground flex items-center gap-3 tracking-[-0.02em]">
 <BedDouble className="w-10 h-10 text-amber-600" />
 The Grand Review
 </h1>
 <p className="text-[#71717a] dark:text-gray-400 mt-2 uppercase tracking-widest text-xs font-semibold tracking-[0.04em]">Guest Experience Management</p>
 </motion.div>

 <div className="view-header grid lg:grid-cols-3 gap-8">
 <motion.div initial={{ opacity: 0, x: -20}} animate={{ opacity: 1, x: 0}} className="lg:col-span-1 bg-card p-8 rounded-none border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 -[8px_8px_0px_0px_rgba(245,158,11,0.2)] h-fit hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <h2 className="text-lg font-serif font-semibold mb-6 text-foreground border-b-2 border-amber-100 pb-2">Submit Feedback</h2>
 <form onSubmit={handleSubmit} className="space-y-5">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Guest Name</label>
 <div className="relative">
 <User className="w-4 h-4 absolute left-3 top-2.5 text-[#71717a] dark:text-gray-400" />
 <input type="text" name="guest_name" value={formData.guest_name} onChange={handleChange} required className="w-full pl-9 p-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-1 focus:ring-amber-500 outline-none" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Room Type</label>
 <select name="room_type" value={formData.room_type} onChange={handleChange} className="w-full p-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-1 focus:ring-amber-500 outline-none">
 <option value="Standard">Standard</option>
 <option value="Deluxe">Deluxe</option>
 <option value="Suite">Suite</option>
 <option value="Penthouse">Penthouse</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Stay Date</label>
 <input type="month" name="stay_date" value={formData.stay_date} onChange={handleChange} required className="w-full p-2 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-1 focus:ring-amber-500 outline-none text-sm" />
 </div>
 </div>
 
 <div className="bg-background p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 space-y-4">
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 flex justify-between tracking-[0.04em]">Overall Rating <span>{formData.rating}/5</span></label>
 <input type="range" min="1" max="5" name="rating" value={formData.rating} onChange={handleChange} className="w-full accent-amber-500" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 flex justify-between tracking-[0.04em]">Cleanliness <span>{formData.cleanliness_score}/5</span></label>
 <input type="range" min="1" max="5" name="cleanliness_score" value={formData.cleanliness_score} onChange={handleChange} className="w-full accent-amber-500" />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 flex justify-between tracking-[0.04em]">Service <span>{formData.service_score}/5</span></label>
 <input type="range" min="1" max="5" name="service_score" value={formData.service_score} onChange={handleChange} className="w-full accent-amber-500" />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-1 tracking-[0.04em]">Review Text</label>
 <textarea name="review_text" value={formData.review_text} onChange={handleChange} required rows="3" className="w-full p-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 focus:ring-1 focus:ring-amber-500 outline-none"></textarea>
 </div>
 <button type="submit" className="w-full bg-slate-800 hover:bg-amber-600 text-white font-semibold py-3 uppercase tracking-widest text-xs transition-colors tracking-[0.04em]">
 Post Review
 </button>
 </form>
 </motion.div>

 <div className="lg:col-span-2">
 {loading ? (
 <div className="flex justify-center py-20"><OrbitLoader size="md" /></div>
 ) : reviews.length === 0 ? (
 <div className="text-center py-20 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-[#71717a] dark:text-gray-400 font-serif hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">No reviews inscribed yet.</div>
 ) : (
 <div className="space-y-6">
 {reviews.map((rev, index) => (
 <motion.div key={rev.id || index} initial={{ opacity: 0, y: 20}} animate={{ opacity: 1, y: 0}} transition={{ delay: index * 0.1}} className="bg-card p-6 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
 
 <div className="flex justify-between items-start mb-4">
 <div>
 <h3 className="font-semibold text-lg text-foreground">{rev.guest_name}</h3>
 <p className="text-xs text-[#71717a] dark:text-gray-400 font-medium uppercase tracking-wider flex items-center gap-2 mt-1 tracking-[0.04em]">
 <span className="bg-muted px-2 py-0.5">{rev.room_type}</span>
 <span>{rev.stay_date}</span>
 </p>
 </div>
 <div className="flex flex-col items-end">
 <div className="flex gap-2 mb-1">{renderStars(rev.rating)}</div>
 <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Overall</span>
 </div>
 </div>

 <p className="text-foreground font-serif italic text-lg leading-relaxed border-l-2 border-primary/40 pl-4 my-4 text-[#71717a] dark:text-gray-400">"{rev.review_text}"</p>

 <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-primary/40">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-xs tracking-[0.04em]">{rev.cleanliness_score}</div>
 <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Cleanliness</span>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-xs tracking-[0.04em]">{rev.service_score}</div>
 <span className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">Service</span>
 </div>
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

export default UnivHotelReview;
