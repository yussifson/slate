import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Mail, Phone, MapPin, CheckCircle, Clock} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';

export default function Contact() {
 const { t} = useTranslation();
 const [formSubmitted, setFormSubmitted] = useState(false);
 const [formData, setFormData] = useState({
 name: '',
 email: '',
 company: '',
 phone: '',
 message: ''
});

 const handleInputChange = (e) => {
 const { name, value} = e.target;
 setFormData(prev => ({ ...prev, [name]: value}));
};

 const handleSubmit = (e) => {
 e.preventDefault();
 if (!formData.name || !formData.email || !formData.message) return;
 setFormSubmitted(true);
 setFormData({ name: '', email: '', company: '', phone: '', message: ''});
};

 const offices = [
 {
 city: "Lagos, Nigeria",
 address: "14 Kingsway Road, Ikoyi, Lagos",
 phone: "+234 1 293 8472",
 email: "lagos@slate.oatstack.com"
},
 {
 city: "Accra, Ghana",
 address: "8 Senchi Street, Airport Residential, Accra",
 phone: "+233 30 293 8472",
 email: "accra@slate.oatstack.com"
},
 {
 city: "Freetown, Sierra Leone",
 address: "42 Siaka Stevens Street, Central, Freetown",
 phone: "+232 76 293 842",
 email: "freetown@slate.oatstack.com"
}
 ];

 return (
 <div className="overflow-x-hidden bg-white min-h-screen hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Hero Section */}
 <section className="relative pt-8 pb-10 md:pt-14 lg:py-16">
 <div className="absolute inset-0 bg-slate-50 pointer-events-none" />
 
 <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md-full bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 text-xs font-semibold text-slate-600 mb-8  tracking-[0.04em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <span className="flex h-2 w-2 rounded-md-full bg-primary" />
 {t("get_in_touch", "Get in Touch")}
 </div>
 <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto mb-6 tracking-[-0.02em]">
 {t("we_re_here_to", "We're here to")}{' '}
 <span className="bg-slate-100 text-primary/70 px-4 py-1 rounded-md-[1.5rem] inline-block mt-2">
 {t("support", "support")}
 </span>{' '}
 {t("you", "you")}
 </h1>
 <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium mb-10">
 {t(
 "whether_you_re_exploring_enter",
 "Whether you're exploring enterprise options, need help migrating data, or have a simple question—our team is ready."
 )}
 </p>
 </div>
 </section>
 {/* Main Content Layout */}
 <section className="py-20 md:py-32 bg-white relative hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-slate-50 to-transparent"></div>
 
 <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
 
 {/* Left Column — Contact Form */}
 <div className="lg:col-span-7">
 <div className="bg-white rounded-md-[2rem] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-8 md:p-12 -slate-200/40 -emerald-900/5 transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {formSubmitted ? (
 <div className="text-center py-20 space-y-6">
 <div className="w-20 h-20 rounded-md-full bg-slate-50 text-primary flex items-center justify-center mx-auto border-8 border-primary/40 ">
 <CheckCircle className="w-10 h-10" />
 </div>
 <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight tracking-[-0.02em]">
 {t("message_received", "Message Received")}
 </h3>
 <p className="text-lg text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
 {t(
 "thank_you_for_reaching_out_a_s",
 "Thank you for reaching out! A specialist has been assigned and will reply to your email shortly."
 )}
 </p>
 <div className="pt-8">
 <Button
 onClick={() => setFormSubmitted(false)}
 className="bg-primary hover:bg-primary/90 text-white font-semibold py-6 px-10 rounded-md-full transition-all duration-300"
 >
 {t("send_another_message", "Send another message")}
 </Button>
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="space-y-8">
 <div>
 <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2 tracking-[-0.02em]">
 {t("send_a_message", "Send a Message")}
 </h3>
 <p className="text-slate-500 font-medium">{t("we_ll_get_back_to_you_within_2", "We'll get back to you within 24 hours.")}</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label htmlFor="name" className="text-xs font-semibold text-slate-700 uppercase tracking-wider tracking-[0.04em]">
 {t("full_name", "Full Name")} <span className="text-red-500">*</span>
 </label>
 <Input
 type="text"
 id="name"
 name="name"
 value={formData.name}
 onChange={handleInputChange}
 placeholder="Jane Doe"
 className="w-full h-14 bg-slate-50 border-primary/40 rounded-md-xl px-4 font-medium focus:bg-white transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 required
 />
 </div>
 <div className="space-y-2">
 <label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-wider tracking-[0.04em]">
 {t("email_address", "Email Address")} <span className="text-red-500">*</span>
 </label>
 <Input
 type="email"
 id="email"
 name="email"
 value={formData.email}
 onChange={handleInputChange}
 placeholder="jane@company.com"
 className="w-full h-14 bg-slate-50 border-primary/40 rounded-md-xl px-4 font-medium focus:bg-white transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 required
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label htmlFor="company" className="text-xs font-semibold text-slate-700 uppercase tracking-wider tracking-[0.04em]">
 {t("company_name", "Company Name")}
 </label>
 <Input
 type="text"
 id="company"
 name="company"
 value={formData.company}
 onChange={handleInputChange}
 placeholder="Acme Corp"
 className="w-full h-14 bg-slate-50 border-primary/40 rounded-md-xl px-4 font-medium focus:bg-white transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 <div className="space-y-2">
 <label htmlFor="phone" className="text-xs font-semibold text-slate-700 uppercase tracking-wider tracking-[0.04em]">
 {t("phone_number", "Phone Number")}
 </label>
 <Input
 type="tel"
 id="phone"
 name="phone"
 value={formData.phone}
 onChange={handleInputChange}
 placeholder="+1 (555) 000-0000"
 className="w-full h-14 bg-slate-50 border-primary/40 rounded-md-xl px-4 font-medium focus:bg-white transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label htmlFor="message" className="text-xs font-semibold text-slate-700 uppercase tracking-wider tracking-[0.04em]">
 {t("how_can_we_help", "How can we help?")} <span className="text-red-500">*</span>
 </label>
 <textarea
 id="message"
 name="message"
 rows="5"
 value={formData.message}
 onChange={handleInputChange}
 placeholder="Tell us about your project or inquiry..."
 className="w-full bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl p-4 font-medium text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-white resize-none transition-colors hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 required
 ></textarea>
 </div>

 <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold text-lg rounded-md-xl -emerald-600/20 -emerald-600/40 hover:-translate-y-0.5 transition-all duration-300">
 {t("send_message", "Send Message")}
 </Button>
 </form>
 )}
 </div>
 </div>

 {/* Right Column — Contact Info */}
 <div className="lg:col-span-5 space-y-8 lg:pl-4">
 <div className="bg-slate-50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-3xl p-8 flex items-start gap-4">
 <div className="w-12 h-12 bg-primary rounded-md-xl flex items-center justify-center text-white shrink-0 mt-1 -emerald-600/20">
 <Clock className="w-6 h-6" />
 </div>
 <div>
 <h3 className="font-semibold text-xl text-slate-900 mb-2">{t("support_hours", "Support Hours")}</h3>
 <p className="text-slate-600 font-medium leading-relaxed">
 {t("monday_friday", "Monday – Friday")}<br />
 {t("8_00_am_5_00_pm_gmt", "8:00 AM – 5:00 PM (GMT)")}
 </p>
 <p className="text-sm text-primary font-semibold mt-4 pt-4 border-t border-primary/20">
 {t(
 "enterprise_subscribers_receive",
 "* Enterprise subscribers receive 24/7 priority support."
 )}
 </p>
 </div>
 </div>

 <div>
 <h3 className="text-2xl font-semibold text-slate-900 mb-6 px-2 tracking-[-0.02em]">{t("regional_offices", "Regional Offices")}</h3>
 <div className="space-y-4">
 {offices.map((office, idx) => {
 return (
 <div
 key={idx}
 className="group rounded-md-3xl p-6 bg-white border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-primary/20 hover:bg-primary/30 transition-colors duration-300 flex items-start gap-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <div className="w-10 h-10 rounded-md-full bg-slate-100 group-hover:bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-primary shrink-0 transition-colors">
 <MapPin className="w-5 h-5" />
 </div>
 <div className="space-y-3">
 <h4 className="font-semibold text-slate-900 text-lg">{office.city}</h4>
 <div className="text-slate-600 font-medium text-sm space-y-2">
 <p>{office.address}</p>
 <p className="flex items-center gap-2 group-hover:text-primary transition-colors">
 <Phone className="w-4 h-4 shrink-0" />
 <span>{office.phone}</span>
 </p>
 <p className="flex items-center gap-2 group-hover:text-primary transition-colors">
 <Mail className="w-4 h-4 shrink-0" />
 <span>{office.email}</span>
 </p>
 </div>
 </div>
 </div>
 );
})}
 </div>
 </div>
 </div>

 </div>
 </div>
 </section>
 </div>
 );
}
