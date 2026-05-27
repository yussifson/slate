import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Shield, FileText, Lock, Cookie } from 'lucide-react';

export default function LegalDocs() {
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
          <p>These Terms of Service ("Terms") govern your access to and use of the Optalflow services, including our various websites, SMS, APIs, email notifications, applications, buttons, and widgets (the "Services").</p>
          <h4 className="font-bold text-slate-900 mt-6 mb-2">1. Your Acceptance</h4>
          <p>By using or accessing the Services, you agree to these Terms. If you do not agree to these Terms, you may not use or access the Services.</p>
          <h4 className="font-bold text-slate-900 mt-6 mb-2">2. Privacy</h4>
          <p>Your privacy is important to us. Please read our Privacy Policy to understand how we collect, use, and share information about you.</p>
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
          <p>Optalflow ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Optalflow.</p>
          <h4 className="font-bold text-slate-900 mt-6 mb-2">Information We Collect</h4>
          <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
          <h4 className="font-bold text-slate-900 mt-6 mb-2">How We Use Information</h4>
          <p>We may use the information we collect about you to provide, maintain, and improve our Services, including, for example, to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support, develop safety features, authenticate users, and send product updates and administrative messages.</p>
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
          <p>Security is a core principle at Optalflow. We implement industry-leading standards to protect your data.</p>
          <ul className="list-disc pl-5 space-y-2 mt-4">
            <li><strong>Data Encryption:</strong> All data is encrypted at rest using AES-256 and in transit using TLS 1.2 or higher.</li>
            <li><strong>Compliance:</strong> We undergo annual SOC 2 Type II audits and comply with GDPR and CCPA.</li>
            <li><strong>Access Control:</strong> Strict role-based access control (RBAC) and mandatory MFA for all administrative access.</li>
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
          <p>This Cookie Policy explains how Optalflow uses cookies and similar technologies to recognize you when you visit our websites.</p>
          <p>Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>
          <p>We use essential cookies to make our site work. We'd also like to use optional analytical cookies to help us improve it. We won't set optional cookies unless you enable them.</p>
        </div>
      )
    }
  ];

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Legal & Security</h1>
        <p className="text-xl text-slate-600">Everything you need to know about our policies and terms.</p>
      </div>

      <div className="space-y-16">
        {sections.map((section) => (
          <div key={section.id} id={section.id} className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200">
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center shrink-0">
                <section.icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
                <p className="text-sm text-slate-500 font-medium">Last updated: {section.lastUpdated}</p>
              </div>
            </div>
            <div className="prose prose-slate max-w-none">
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
