import os

PAGES = [
    ("VDashboard.jsx", "Vocational Dashboard", "Overview of trainee statistics, course completion, and placement rates.", "LayoutDashboard"),
    ("VTrades.jsx", "Trades & Programs", "Manage vocational trades like Welding, Carpentry, Plumbing, and more.", "Tool"),
    ("VCourses.jsx", "Courses", "Manage course curriculums and offerings.", "BookOpen"),
    ("VWorkshops.jsx", "Workshops", "Manage practical workshop sessions and locations.", "Building2"),
    ("VPracticalModules.jsx", "Practical Modules", "Track hands-on modules and practical learning materials.", "Layers"),
    ("VTraineeProfiles.jsx", "Trainee Profiles", "Manage trainee information, personal details, and assigned programs.", "Users"),
    ("VTrainingProgress.jsx", "Training Progress", "Track individual trainee progress through their enrolled courses.", "TrendingUp"),
    ("VWorkshopAssessments.jsx", "Workshop Assessments", "Evaluate trainees based on their workshop performance.", "CheckSquare"),
    ("VPracticalExams.jsx", "Practical Exams", "Schedule and record grades for hands-on practical exams.", "FileCheck"),
    ("VSkillDemonstrations.jsx", "Skill Demonstrations", "Record and evaluate live skill demonstrations by trainees.", "Sparkles"),
    ("VCompetencyTracking.jsx", "Competency Tracking", "Map and track trainee competencies against industry standards.", "Target"),
    ("VEquipmentInventory.jsx", "Equipment Inventory", "Manage inventory of tools and machinery.", "Package"),
    ("VEquipmentReservations.jsx", "Equipment Reservations", "Book equipment for classes or practical exams.", "Calendar"),
    ("VMaintenance.jsx", "Equipment Maintenance", "Schedule and track maintenance for workshop machinery.", "Wrench"),
    ("VInternshipTracking.jsx", "Internship Tracking", "Monitor trainees placed in industry internships.", "Briefcase"),
    ("VIndustrialAttachments.jsx", "Industrial Attachments", "Manage partnerships with industries for attachments.", "Building"),
    ("VEmployerEvaluations.jsx", "Employer Evaluations", "Feedback and evaluations from employers for attached trainees.", "Star"),
    ("VCertificates.jsx", "Certificates", "Issue and manage course completion certificates.", "Award"),
    ("VSkillBadges.jsx", "Skill Badges", "Award micro-credentials and skill badges to trainees.", "ShieldCheck"),
    ("VQualificationTracking.jsx", "Qualification Tracking", "Track formal qualifications achieved by trainees.", "GraduationCap"),
    ("VJobOpportunities.jsx", "Job Opportunities", "List and manage available jobs for graduates.", "Search"),
    ("VEmployers.jsx", "Employers", "Manage relationships with partner employers.", "Users2"),
    ("VPlacementReports.jsx", "Placement Reports", "Generate reports on trainee job placements.", "FileText"),
    ("VCertificationRates.jsx", "Certification Rates", "Analytics on trainee certification success rates.", "PieChart"),
    ("VEmploymentRates.jsx", "Employment Rates", "Analytics on graduate employment and placement success.", "TrendingUp"),
    ("VCoursePerformance.jsx", "Course Performance", "Analytics on the effectiveness of various vocational courses.", "BarChart2")
]

TEMPLATE = """import React from 'react';
import { useTranslation } from 'react-i18next';
import { {icon_name}, Search, Filter, Plus, ChevronRight, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function {component_name}() {{
  const {{ t }} = useTranslation();

  return (
    <div className="flex-1 space-y-6 p-8 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <{icon_name} className="w-6 h-6" />
            </div>
            {title}
          </h2>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-[250px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
            />
          </div>
          <Button variant="outline" className="gap-2 bg-white dark:bg-slate-900">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105">
            <Plus className="w-4 h-4" /> Add New
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">124</div>
            <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="w-3 h-3" /> +12% this month
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">18</div>
            <div className="text-xs text-amber-500 flex items-center gap-1 mt-1 font-medium">
              Needs attention
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">94%</div>
            <div className="text-xs text-primary/70 flex items-center gap-1 mt-1 font-medium">
              Above average
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Data Section */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold">Recent Records</h3>
        </div>
        <div className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {{[1, 2, 3, 4, 5].map((item) => (
              <div key={{item}} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    #{{item}}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Record Item {{item}}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Updated 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200 border-none">Active</Badge>
                  <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}}
          </div>
        </div>
      </Card>
    </div>
  );
}}
"""

OUTPUT_DIR = "src/pages/vocational"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

for filename, title, description, icon in PAGES:
    component_name = filename.split('.')[0]
    # For Lucide icons, replace generic names if necessary, but assume they exist.
    content = TEMPLATE.replace("{component_name}", component_name)
    content = content.replace("{title}", title)
    content = content.replace("{description}", description)
    content = content.replace("{icon_name}", icon if icon != "Tool" else "Wrench") # Lucide React doesn't have "Tool", using Wrench or similar. Wait, it has PenTool. Let's just use LayoutDashboard if icon is weird.
    
    # fix icons
    icon_imports = []
    if icon == "Tool": content = content.replace("<Tool", "<Wrench").replace("{icon_name}", "Wrench")
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w") as f:
        f.write(content)
        
print("Successfully generated all vocational pages!")
