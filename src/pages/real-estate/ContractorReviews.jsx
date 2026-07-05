import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Plus, Edit, Trash2, Search, ThumbsUp, MessageCircle } from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealEstateAPI } from '@/api/RealEstateAPI';
import { toast } from 'react-hot-toast';

export default function ContractorReviews() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const powerSync = usePowerSync();

  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    contractorId: '',
    reviewTitle: '',
    reviewText: '',
    rating: 5,
    punctualityRating: 5,
    qualityRating: 5,
    professionalismRating: 5,
    wouldRehire: true,
  });

  // Fetch contractor reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await powerSync.execute(
          'SELECT * FROM univ_re_contractor_reviews WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        const data = res.rows._array || Array.from(res.rows);
        setReviews(data);
      } catch (e) {
        console.error('[ContractorReviews] Fetch failed:', e);
        toast.error('Failed to load reviews');
      }
      setIsLoading(false);
    };

    if (companyId) fetchReviews();
  }, [companyId]);

  // Filter reviews
  useEffect(() => {
    let filtered = reviews;
    if (search) {
      filtered = filtered.filter(r =>
        r.review_title?.toLowerCase().includes(search.toLowerCase()) ||
        r.contractor_id?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter);
      filtered = filtered.filter(r => r.rating === minRating);
    }
    setFilteredReviews(filtered);
  }, [reviews, search, ratingFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await RealEstateAPI.updateContractorReview(companyId, editingId, formData, user.id);
        toast.success('Review updated successfully');
      } else {
        await RealEstateAPI.createContractorReview(companyId, formData, user.id);
        toast.success('Review created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        contractorId: '',
        reviewTitle: '',
        reviewText: '',
        rating: 5,
        punctualityRating: 5,
        qualityRating: 5,
        professionalismRating: 5,
        wouldRehire: true,
      });

      const res = await powerSync.execute(
        'SELECT * FROM univ_re_contractor_reviews WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setReviews(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[ContractorReviews] Submit failed:', e);
      toast.error('Failed to save review');
    }
  };

  const handleEdit = (review) => {
    setFormData({
      contractorId: review.contractor_id || '',
      reviewTitle: review.review_title || '',
      reviewText: review.review_text || '',
      rating: review.rating || 5,
      punctualityRating: review.punctuality_rating || 5,
      qualityRating: review.quality_rating || 5,
      professionalismRating: review.professionalism_rating || 5,
      wouldRehire: review.would_rehire !== false,
    });
    setEditingId(review.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await RealEstateAPI.deleteContractorReview(companyId, id, user.id);
      toast.success('Review deleted successfully');
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_contractor_reviews WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      setReviews(res.rows._array || Array.from(res.rows));
    } catch (e) {
      console.error('[ContractorReviews] Delete failed:', e);
      toast.error('Failed to delete review');
    }
  };

  // KPI calculations
  const totalReviews = reviews.length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;
  const wouldRehire = reviews.filter(r => r.would_rehire).length;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contractor Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">Track feedback and ratings from contractor work</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({
          contractorId: '',
          reviewTitle: '',
          reviewText: '',
          rating: 5,
          punctualityRating: 5,
          qualityRating: 5,
          professionalismRating: 5,
          wouldRehire: true,
        }); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Review
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold">{totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">Reviews posted</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{avgRating} ⭐</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 5</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              Would Rehire
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
            <div className="text-sm font-bold text-green-600 dark:text-green-400">{wouldRehire}/{totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalReviews > 0 ? ((wouldRehire / totalReviews) * 100).toFixed(0) : 0}% positive</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or contractor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {filteredReviews.map(review => (
          <Card key={review.id} className="relative group bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-bl-3xl border-b border-l border-primary/20 pointer-events-none z-0 transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/10 rounded-tl-[4rem] pointer-events-none z-0 transition-colors duration-500 group-hover:bg-primary/20" />
            <CardHeader className="relative p-4 border-b border-slate-100 dark:border-slate-800/50 bg-transparent overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{review.review_title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Contractor: {review.contractor_id?.substring(0, 20)}</p>
                </div>
                <div className="flex gap-1">
                  {renderStars(review.rating)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col gap-3 relative z-10 bg-transparent">
              <p className="text-sm text-foreground">{review.review_text}</p>

              <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Punctuality</p>
                  <div className="flex gap-0.5">{renderStars(review.punctuality_rating)}</div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Quality</p>
                  <div className="flex gap-0.5">{renderStars(review.quality_rating)}</div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Professionalism</p>
                  <div className="flex gap-0.5">{renderStars(review.professionalism_rating)}</div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Rehire?</p>
                  <Badge variant={review.would_rehire ? 'default' : 'outline'}>
                    {review.would_rehire ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(review)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(review.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <Card className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700">
          <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No reviews found. Add your first review!</p>
        </Card>
      )}

      {/* Review Form Modal */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Review' : 'Add Contractor Review'}</SheetTitle>
            <SheetDescription>Rate and review contractor performance</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium">Contractor ID</label>
              <Input
                value={formData.contractorId}
                onChange={(e) => setFormData({ ...formData, contractorId: e.target.value })}
                placeholder="e.g., CONTRACTOR-123"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Review Title</label>
              <Input
                value={formData.reviewTitle}
                onChange={(e) => setFormData({ ...formData, reviewTitle: e.target.value })}
                placeholder="e.g., Great work on the renovation"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Review Text</label>
              <textarea
                value={formData.reviewText}
                onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                placeholder="Detailed review..."
                className="w-full p-2 border rounded text-sm"
                rows="4"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Overall Rating: {formData.rating} ⭐</label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Punctuality: {formData.punctualityRating} ⭐</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.punctualityRating}
                  onChange={(e) => setFormData({ ...formData, punctualityRating: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Quality: {formData.qualityRating} ⭐</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.qualityRating}
                  onChange={(e) => setFormData({ ...formData, qualityRating: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Professionalism: {formData.professionalismRating} ⭐</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.professionalismRating}
                  onChange={(e) => setFormData({ ...formData, professionalismRating: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.wouldRehire}
                onChange={(e) => setFormData({ ...formData, wouldRehire: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm font-medium">Would Rehire</label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update' : 'Create'} Review
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
