import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, BookOpen, Clock, MapPin, Calendar, Share2, Shield } from 'lucide-react';

export default function LearnerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real system, you'd fetch the public profile. Here we mock it slightly using users table or metadata if available
        // For now, we will simulate fetching a user's public info
        setProfile({
            id: id,
            full_name: 'Alex Johnson',
            bio: 'Passionate learner and software developer exploring the latest in web technologies.',
            location: 'San Francisco, CA',
            joined: '2025-01-15',
            avatar_url: `https://ui-avatars.com/api/?name=Alex+Johnson&background=0056D2&color=fff&size=200`
        });

        // Fetch public enrollments or completed courses
        const e = await base44.entities.online_enrollments.filter({ student_id: id });
        const completed = (e || []).filter(en => en.progress_percent >= 100);
        setEnrollments(completed);

        if (completed.length > 0) {
            const courseIds = completed.map(c => c.course_id);
            const cList = await base44.entities.online_courses.filter({ id: courseIds });
            const cMap = {};
            cList.forEach(c => cMap[c.id] = c);
            setCourses(cMap);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F7F8]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056D2]"></div></div>;

  const isOwnProfile = user?.id === id;

  return (
    <div className="min-h-screen bg-[#F5F7F8] font-sans pb-20">
      {/* Profile Header */}
      <div className="bg-[#1A1A1A] pt-20 pb-32 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
              <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-[#0056D2] rounded-full blur-[100px]"></div>
          </div>
          <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
              <img src={profile.avatar_url} alt="Profile" className="w-32 h-32 rounded-full border-4 border-[#1A1A1A] shadow-xl bg-white mb-6" />
              <h1 className="text-4xl font-extrabold text-white mb-2">{profile.full_name}</h1>
              <p className="text-xl text-gray-300 max-w-2xl mb-6">{profile.bio}</p>
              
              <div className="flex items-center gap-6 text-sm text-gray-400">
                  <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {profile.location}</span>
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined {new Date(profile.joined).toLocaleDateString()}</span>
              </div>
          </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20">
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white mb-8">
              <div className="flex divide-x divide-gray-100">
                  <div className="flex-1 p-6 text-center">
                      <div className="text-3xl font-extrabold text-[#0056D2] mb-1">{enrollments.length}</div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed Courses</div>
                  </div>
                  <div className="flex-1 p-6 text-center">
                      <div className="text-3xl font-extrabold text-gray-900 mb-1">12</div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Certificates Earned</div>
                  </div>
                  <div className="flex-1 p-6 text-center flex flex-col items-center justify-center">
                      {isOwnProfile ? (
                          <Button variant="outline" className="w-full max-w-[200px] border-gray-300"><Shield className="w-4 h-4 mr-2"/> Edit Privacy</Button>
                      ) : (
                          <Button className="w-full max-w-[200px] bg-[#0056D2] hover:bg-[#004bb5]"><Share2 className="w-4 h-4 mr-2"/> Share Profile</Button>
                      )}
                  </div>
              </div>
          </Card>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Achievements</h2>
          
          {enrollments.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                  <Award className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">No achievements yet</h3>
                  <p className="text-gray-500 mt-2">Completed courses and certificates will appear here.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {enrollments.map(en => {
                      const course = courses[en.course_id];
                      if (!course) return null;
                      return (
                          <Card key={en.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                              <CardContent className="p-6 flex gap-6 items-center">
                                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                                      <Award className="w-8 h-8 text-[#0056D2]" />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight mb-1">{course.title}</h3>
                                      <p className="text-sm text-gray-500 flex items-center gap-2">
                                          <Clock className="w-4 h-4" /> Completed {new Date(en.last_accessed).toLocaleDateString()}
                                      </p>
                                  </div>
                              </CardContent>
                          </Card>
                      )
                  })}
              </div>
          )}
      </div>
    </div>
  );
}
