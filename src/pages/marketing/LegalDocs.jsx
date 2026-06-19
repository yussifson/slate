import { useTranslation } from "react-i18next";
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Shield, FileText, Lock, Cookie } from 'lucide-react';

export default function LegalDocs() {
  const { t } = useTranslation();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  const sections = [
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: FileText,
      lastUpdated: 'May 1, 2026',
      content: (
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>{t(
            "these_terms_of_service_terms_g",
            "These Terms of Service (\"Terms\") govern your access to and use of the Slate services, including our various websites, SMS, APIs, email notifications, applications, buttons, and widgets (the \"Services\")."
          )}</p>
          <h4 className="font-semibold text-slate-900 mt-6 mb-2">{t("1_your_acceptance", "1. Your Acceptance")}</h4>
          <p>{t(
            "by_using_or_accessing_the_serv",
            "By using or accessing the Services, you agree to these Terms. If you do not agree to these Terms, you may not use or access the Services."
          )}</p>
          <h4 className="font-semibold text-slate-900 mt-6 mb-2">{t("2_privacy", "2. Privacy")}</h4>
          <p>{t(
            "your_privacy_is_important_to_u",
            "Your privacy is important to us. Please read our Privacy Policy to understand how we collect, use, and share information about you."
          )}</p>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: Lock,
      lastUpdated: 'April 15, 2026',
      content: (
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>{t(
            "slate_we_our_or_us_is_comm",
            "Slate (\"we\", \"our\", or \"us\") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Slate."
          )}</p>
          <h4 className="font-semibold text-slate-900 mt-6 mb-2">{t("information_we_collect", "Information We Collect")}</h4>
          <p>{t(
            "we_collect_information_you_pro",
            "We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us."
          )}</p>
          <h4 className="font-semibold text-slate-900 mt-6 mb-2">{t("how_we_use_information", "How We Use Information")}</h4>
          <p>{t(
            "we_may_use_the_information_we_",
            "We may use the information we collect about you to provide, maintain, and improve our Services, including, for example, to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support, develop safety features, authenticate users, and send product updates and administrative messages."
          )}</p>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Security',
      icon: Shield,
      lastUpdated: 'January 10, 2026',
      content: (
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>{t(
            "security_is_a_core_principle_a",
            "Security is a core principle at Slate. We implement industry-leading standards to protect your data."
          )}</p>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li><strong>{t("data_encryption", "Data Encryption:")}</strong> {t(
                "all_data_is_encrypted_at_rest_",
                "All data is encrypted at rest using AES-256 and in transit using TLS 1.2 or higher."
              )}</li>
            <li><strong>{t("compliance", "Compliance:")}</strong> {t(
                "we_undergo_annual_soc_2_type_i",
                "We undergo annual SOC 2 Type II audits and comply with GDPR and CCPA."
              )}</li>
            <li><strong>{t("access_control", "Access Control:")}</strong> {t(
                "strict_role_based_access_contr",
                "Strict role-based access control (RBAC) and mandatory MFA for all administrative access."
              )}</li>
          </ul>
        </div>
      )
    },
    {
      id: 'cookies',
      title: 'Cookie Policy',
      icon: Cookie,
      lastUpdated: 'March 20, 2026',
      content: (
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>{t(
            "this_cookie_policy_explains_ho",
            "This Cookie Policy explains how Slate uses cookies and similar technologies to recognize you when you visit our websites."
          )}</p>
          <p>{t(
            "cookies_are_small_data_files_t",
            "Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information."
          )}</p>
          <p>{t(
            "we_use_essential_cookies_to_ma",
            "We use essential cookies to make our site work. We'd also like to use optional analytical cookies to help us improve it. We won't set optional cookies unless you enable them."
          )}</p>
        </div>
      )
    }
  ];

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 tracking-[-0.02em]">{t("legal_security", "Legal & Security")}</h1>
        <p className="text-xl text-slate-600">{t(
          "everything_you_need_to_know_ab",
          "Everything you need to know about our policies and terms."
        )}</p>
      </div>
      <div className="space-y-16">
        {sections.map(section => {
          return (
            <div key={section.id} id={section.id} className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-primary/40">
                <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-md-xl flex items-center justify-center shrink-0">
                  <section.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 tracking-[-0.02em]">{section.title}</h2>
                  <p className="text-sm text-slate-500 font-medium">{t("last_updated", "Last updated:")} {section.lastUpdated}</p>
                </div>
              </div>
              <div className="prose prose-slate max-w-none">
                {section.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
