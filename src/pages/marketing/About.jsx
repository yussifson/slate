import { useTranslation } from "react-i18next";
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Target, Shield, Users, Globe, Clock, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function About() {
  const { t } = useTranslation();
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To build the most secure, comprehensive practice operating system that empowers businesses to automate manual tasks and serve clients seamlessly."
    },
    {
      icon: Shield,
      title: "Data Security",
      description: "We hold client secrecy and operational integrity as our ultimate directive. Every transaction, project document, and link is encrypted with advanced protocols."
    },
    {
      icon: Users,
      title: "Inclusivity & Growth",
      description: "We are committed to building local digital infrastructures, serving small teams and enterprise organizations globally."
    }
  ];

  const stats = [
    { value: "500+", label: "Organizations", icon: Users },
    { value: "12", label: "Countries", icon: Globe },
    { value: "99.9%", label: "Uptime", icon: Clock },
    { value: "24/7", label: "Support", icon: Headphones },
  ];

  return (
    <div className="overflow-x-hidden bg-white min-h-screen">
      <Helmet>
        <title>About Us | Slate AI Work made effortless.</title>
        <meta name="description" content="Learn more about Slate. We are a team of engineers building the ultimate AI Work made effortless. for modern businesses." />
      </Helmet>
      {/* Hero Section */}
      <section className="relative py-10 md:py-14 lg:py-16">
        <div className="absolute inset-0 bg-slate-50 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            {t("our_story", "Our Story")}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto mb-6">
            {t("digitizing_business_operations", "Digitizing business operations")}{' '}
            <span className="bg-emerald-100 text-emerald-900 px-4 py-1 rounded-[1.5rem] inline-block mt-2">
              {t("globally", "globally")}
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium mb-10">
            {t(
              "founded_by_a_team_of_industry_",
              "Founded by a team of industry practitioners and engineers, Slate is the first dedicated SaaS business management platform custom-built for regional and global operational excellence."
            )}
          </p>
        </div>
      </section>
      {/* Story Section — Two Column */}
      <section className="py-24 md:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left — Narrative */}
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
                {t("why_we_built", "Why we built")} <span className="text-emerald-600">{t("slate", "Slate")}</span>
              </h2>
              <div className="space-y-6 text-lg text-slate-600 font-medium leading-relaxed">
                <p>
                  {t(
                    "operations_have_long_relied_on",
                    "Operations have long relied on legacy software, paper files, or separate applications for emails, calendars, billing, and team communication. This fragmentation leads to lost billable hours, administrative confusion, and security liabilities."
                  )}
                </p>
                <p>
                  {t(
                    "we_created_slate_to_provid",
                    "We created Slate to provide a single, premium, cohesive ecosystem. An OS where an organization can check pipelines, message a client, sync calendars, track consulting hours, and receive secure payments in one click."
                  )}
                </p>
              </div>
              
              <div className="pt-6 grid grid-cols-2 gap-8">
                <div>
                  <div className="font-black text-5xl text-slate-900 mb-2">{t("500", "500+")}</div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t("organizations", "Organizations")}</div>
                </div>
                <div>
                  <div className="font-black text-5xl text-slate-900 mb-2">{t("12", "12")}</div>
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t("countries_active", "Countries Active")}</div>
                </div>
              </div>
            </div>

            {/* Right — Visual Collage */}
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-600/5 blur-[100px] rounded-full"></div>
              <div className="relative rounded-[2rem] border border-slate-200/60 bg-white p-2 shadow-2xl overflow-hidden aspect-[4/5] transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                <img src="/images/hero_dashboard_ui.png" alt="Slate Interface" className="w-full h-full object-cover rounded-[1.5rem]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-8">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl w-full">
                    <p className="text-white font-medium italic">{t(
                      "the_single_best_decision_our_o",
                      "\"The single best decision our operations team has made this decade.\""
                    )}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Core Values Section */}
      <section className="bg-slate-50 border-y border-slate-100 py-24 md:py-32 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(148, 163, 184, 0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
              {t("the_values_that_drive_us", "The values that drive us")}
            </h2>
            <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">
              {t(
                "our_principles_define_every_li",
                "Our principles define every line of code we write and every feature we ship."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {values.map((v, i) => {
              return (
                <div
                  key={i}
                  className="bg-white border border-slate-200/60 rounded-[2rem] p-10 shadow-xl shadow-slate-200/20 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 flex items-center justify-center text-emerald-600 group-hover:text-white mb-8 transition-colors duration-300">
                    <v.icon className="w-8 h-8" strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-2xl text-slate-900 mb-4">{v.title}</h3>
                  <p className="text-base text-slate-600 font-medium leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-8">
            {t("join_the_future_of_business_op", "Join the future of business operations")}
          </h2>
          <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed mb-12">
            {t(
              "sign_up_today_to_create_a_dedi",
              "Sign up today to create a dedicated subdomain workspace for your partners, team, and clients. Explore the trial with no commitment."
            )}
          </p>
          <Link to="/signup">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-7 px-12 rounded-full shadow-lg transition-all duration-300 text-lg">
              {t("start_your_free_trial", "Start Your Free Trial")}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
