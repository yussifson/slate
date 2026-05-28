import { Link } from 'react-router-dom';
import { Scale, Users, CreditCard, Mail, Shield, Clock, LayoutDashboard, FileText, CheckCircle2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Features() {
  return (
    <div className="overflow-x-hidden bg-background text-foreground pb-20">
      {/* Hero */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-playfair tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-[1.1]">
              The complete infrastructure for <span className="text-primary font-medium">modern legal teams</span>
            </h1>
            <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
              A carefully crafted suite of tools that work together beautifully, so you can focus on winning cases instead of fighting software.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Bento Box Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[360px]">
          
          {/* Card 1: Large Featured Card (Spans 2 columns) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-2 bg-muted/10 border border-border/50 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group hover:border-primary/30 transition-colors duration-500"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
              <Scale className="w-72 h-72 text-primary" strokeWidth={0.5} />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-end max-w-lg">
              <div className="w-14 h-14 bg-background rounded-2xl border border-border/50 flex items-center justify-center mb-8 shadow-sm">
                <LayoutDashboard className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-playfair font-semibold mb-4 text-foreground">Matter Management</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Organize every case effortlessly. Track disputes, critical filings, and case milestones using simple, visual pipelines that keep your entire team aligned.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Square Card (Accent Color) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-primary/[0.03] border border-primary/20 rounded-[2rem] p-8 md:p-10 flex flex-col relative overflow-hidden group hover:border-primary/40 transition-colors duration-500"
          >
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
            <div className="w-14 h-14 bg-background rounded-2xl border border-border/50 flex items-center justify-center mb-8 shadow-sm relative z-10">
              <CreditCard className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl md:text-3xl font-playfair font-semibold mb-4 text-foreground relative z-10">Time & Billing</h3>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 flex-1 relative z-10">
              Never miss a billable hour again. Simple timers and elegant invoice generation built right into your workflow.
            </p>
            <ul className="space-y-3 mt-auto relative z-10">
              <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                <CheckCircle2 className="w-5 h-5 text-primary"/> Paystack Integration
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                <CheckCircle2 className="w-5 h-5 text-primary"/> Smart Payment Reminders
              </li>
            </ul>
          </motion.div>

          {/* Card 3: Square Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card border border-border/50 rounded-[2rem] p-8 md:p-10 flex flex-col hover:border-primary/30 transition-colors duration-500 shadow-sm"
          >
             <div className="w-14 h-14 bg-muted/40 rounded-2xl flex items-center justify-center mb-8">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-2xl md:text-3xl font-playfair font-semibold mb-4 text-foreground">Client Portals</h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Give your clients a premium experience with a dedicated, secure space to view updates, sign documents, and message your team directly.
            </p>
          </motion.div>

          {/* Card 4: Horizontal Card (Spans 2 columns) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="md:col-span-2 bg-card border border-border/50 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 hover:border-primary/30 transition-colors duration-500 shadow-sm"
          >
            <div className="flex-1">
              <div className="w-14 h-14 bg-muted/40 rounded-2xl flex items-center justify-center mb-8">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-playfair font-semibold mb-4 text-foreground">Uncompromising Security</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Bank-grade encryption, detailed audit logs, and strict access controls ensure your firm's sensitive data is always protected and fully compliant with regional regulations.
              </p>
            </div>
            <div className="hidden md:flex w-1/3 justify-center relative">
              <div className="relative w-full aspect-square max-w-[220px] border-[12px] border-muted/30 rounded-full flex items-center justify-center">
                 <Shield className="w-16 h-16 text-primary/40" strokeWidth={1} />
                 <div className="absolute -inset-1 border-2 border-primary/60 rounded-full border-dashed animate-[spin_30s_linear_infinite]" />
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Grid of smaller features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border/50 rounded-[2rem] p-8 hover:border-primary/30 transition-colors shadow-sm"
            >
              <Mail className="w-8 h-8 text-primary mb-5" strokeWidth={1.5} />
              <h4 className="font-semibold text-xl mb-3 text-foreground">Email & WhatsApp</h4>
              <p className="text-base text-muted-foreground leading-relaxed">Automatically sync your external communications directly to the relevant case file for a complete history.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border/50 rounded-[2rem] p-8 hover:border-primary/30 transition-colors shadow-sm"
            >
              <FileText className="w-8 h-8 text-primary mb-5" strokeWidth={1.5} />
              <h4 className="font-semibold text-xl mb-3 text-foreground">Document Storage</h4>
              <p className="text-base text-muted-foreground leading-relaxed">Keep all pleadings and evidence centralized, searchable, and securely backed up in the cloud.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border/50 rounded-[2rem] p-8 hover:border-primary/30 transition-colors shadow-sm md:col-span-3 mt-4"
            >
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1">
                  <Share2 className="w-10 h-10 text-primary mb-5" strokeWidth={1.5} />
                  <h4 className="font-semibold text-2xl mb-3 text-foreground">Premium SaaS Integrations Hub</h4>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                    Connect the power of global industry systems directly inside your workspace. LexAfrica connects your calendars, billing accounts, and communications instantly.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40">
                    <span className="text-xs font-bold text-primary block mb-1">📹 ZOOM CONSULTATIONS</span>
                    <p className="text-xs text-muted-foreground">Auto-generate video meeting channels directly within client calendar slots.</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40">
                    <span className="text-xs font-bold text-primary block mb-1">💳 STRIPE & PAYSTACK</span>
                    <p className="text-xs text-muted-foreground">Accept card, bank, and mobile transfers with multi-currency ledgers.</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40">
                    <span className="text-xs font-bold text-primary block mb-1">✍️ SECURE DOCUSIGN</span>
                    <p className="text-xs text-muted-foreground">Draft covenants and sign agreements with binding legal digital trails.</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/40">
                    <span className="text-xs font-bold text-primary block mb-1">💬 SLACK REAL-TIME</span>
                    <p className="text-xs text-muted-foreground">Broadcast workflow alerts, reminders, and notifications to channels.</p>
                  </div>
                </div>
              </div>
            </motion.div>
         </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 text-center mt-12 bg-muted/10 border-t border-border/40">
        <h2 className="text-4xl md:text-5xl font-playfair font-normal text-foreground mb-6">
          Ready to <span className="text-primary font-medium">get started?</span>
        </h2>
        <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed mb-10">
          Reach out to our team to discuss how LexAfrica can support your firm's specific operational needs.
        </p>
        <Link to="/contact">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-7 px-12 rounded-full shadow-md transition-all hover:scale-105 text-lg tracking-wide">
            Contact Sales
          </Button>
        </Link>
      </section>

    </div>
  );
}
