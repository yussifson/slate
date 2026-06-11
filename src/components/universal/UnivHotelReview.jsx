import React, { useState, useEffect } from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Star, BedDouble, User, Calendar, Sparkles, ThumbsUp } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

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
      const { data, error } = await supabase.from('univ_hotelreview').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('univ_hotelreview').insert([{ ...formData, company_id: companyId }]);
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col items-center">
        <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <BedDouble className="w-10 h-10 text-amber-600" />
          The Grand Review
        </h1>
        <p className="text-muted-foreground mt-2 uppercase tracking-widest text-xs font-bold">Guest Experience Management</p>
      </motion.div>

      <div className="view-header grid lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 bg-card p-8 rounded-none border border-border shadow-[8px_8px_0px_0px_rgba(245,158,11,0.2)] h-fit">
          <h2 className="text-lg font-serif font-bold mb-6 text-foreground border-b-2 border-amber-100 pb-2">Submit Feedback</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Guest Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input type="text" name="guest_name" value={formData.guest_name} onChange={handleChange} required className="w-full pl-9 p-2 bg-background border border-border focus:ring-1 focus:ring-amber-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Room Type</label>
                <select name="room_type" value={formData.room_type} onChange={handleChange} className="w-full p-2 bg-background border border-border focus:ring-1 focus:ring-amber-500 outline-none">
                  <option value="Standard">Standard</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                  <option value="Penthouse">Penthouse</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Stay Date</label>
                <input type="month" name="stay_date" value={formData.stay_date} onChange={handleChange} required className="w-full p-2 bg-background border border-border focus:ring-1 focus:ring-amber-500 outline-none text-sm" />
              </div>
            </div>
            
            <div className="bg-background p-4 border border-border space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex justify-between">Overall Rating <span>{formData.rating}/5</span></label>
                <input type="range" min="1" max="5" name="rating" value={formData.rating} onChange={handleChange} className="w-full accent-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex justify-between">Cleanliness <span>{formData.cleanliness_score}/5</span></label>
                <input type="range" min="1" max="5" name="cleanliness_score" value={formData.cleanliness_score} onChange={handleChange} className="w-full accent-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex justify-between">Service <span>{formData.service_score}/5</span></label>
                <input type="range" min="1" max="5" name="service_score" value={formData.service_score} onChange={handleChange} className="w-full accent-amber-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Review Text</label>
              <textarea name="review_text" value={formData.review_text} onChange={handleChange} required rows="3" className="w-full p-3 bg-background border border-border focus:ring-1 focus:ring-amber-500 outline-none"></textarea>
            </div>
            <button type="submit" className="w-full bg-slate-800 hover:bg-amber-600 text-white font-bold py-3 uppercase tracking-widest text-xs transition-colors">
              Post Review
            </button>
          </form>
        </motion.div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-20"><Sparkles className="w-10 h-10 text-amber-400 animate-spin" /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border text-muted-foreground font-serif">No reviews inscribed yet.</div>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev, index) => (
                <motion.div key={rev.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-card p-6 border border-border relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{rev.guest_name}</h3>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2 mt-1">
                        <span className="bg-muted px-2 py-0.5">{rev.room_type}</span>
                        <span>{rev.stay_date}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex gap-1 mb-1">{renderStars(rev.rating)}</div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Overall</span>
                    </div>
                  </div>

                  <p className="text-foreground font-serif italic text-lg leading-relaxed border-l-2 border-border pl-4 my-4 text-muted-foreground">"{rev.review_text}"</p>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">{rev.cleanliness_score}</div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Cleanliness</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs">{rev.service_score}</div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Service</span>
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
