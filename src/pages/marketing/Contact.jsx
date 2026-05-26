import { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Contact() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    firm: '',
    phone: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setFormSubmitted(true);
    setFormData({ name: '', email: '', firm: '', phone: '', message: '' });
  };

  const offices = [
    {
      city: "Lagos, Nigeria",
      address: "14 Kingsway Road, Ikoyi, Lagos",
      phone: "+234 1 293 8472",
      email: "lagos@airzyle.oatstack.com"
    },
    {
      city: "Accra, Ghana",
      address: "8 Senchi Street, Airport Residential, Accra",
      phone: "+233 30 293 8472",
      email: "accra@airzyle.oatstack.com"
    },
    {
      city: "Freetown, Sierra Leone",
      address: "42 Siaka Stevens Street, Central, Freetown",
      phone: "+232 76 293 842",
      email: "freetown@airzyle.oatstack.com"
    }
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
            Get in Touch
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            We're here to support your firm
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have questions about migrating case files, custom regional subdomain pipelines, or integrating Paystack payments? Send us a message and our success team will respond in less than an hour.
          </p>
        </div>
      </section>

      {/* Two-Column Layout */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">

          {/* Left Column — Contact Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                Contact Information
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span>Mon – Fri, 8:00 AM – 5:00 PM (GMT / WAT)</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Premium and Enterprise subscribers receive priority 24/7 emergency hotline access.
              </p>
            </div>

            <div className="space-y-4">
              {offices.map((office, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-6 bg-card border border-border/60 space-y-4 hover:shadow-lg transition-shadow duration-300"
                >
                  <h3 className="font-bold text-foreground text-base flex items-center gap-2.5">
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <span>{office.city}</span>
                  </h3>
                  <div className="text-muted-foreground text-sm pl-7 space-y-2">
                    <p>{office.address}</p>
                    <p className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                      <Phone className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      <span>{office.phone}</span>
                    </p>
                    <p className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                      <Mail className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      <span>{office.email}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column — Contact Form */}
          <div className="lg:col-span-7 rounded-2xl bg-card border border-border/60 p-6 md:p-10 hover:shadow-lg transition-shadow duration-300">
            {formSubmitted ? (
              <div className="text-center py-16 space-y-5">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border border-emerald-100 animate-bounce">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">
                  Message Received Successfully!
                </h3>
                <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. A Airzyle product counselor has been assigned and will reply shortly to your email.
                </p>
                <div className="pt-3">
                  <Button
                    onClick={() => setFormSubmitted(false)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-xl transition-all"
                  >
                    Send another message
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-xl font-bold text-foreground tracking-tight">
                  Send a Message
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-foreground">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Advocate Adama Mensah"
                      required
                      className="py-3 rounded-xl border-border bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="adama@mensahchambers.com"
                      required
                      className="py-3 rounded-xl border-border bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="firm" className="text-sm font-medium text-foreground">
                      Law Firm Name
                    </label>
                    <Input
                      type="text"
                      id="firm"
                      name="firm"
                      value={formData.firm}
                      onChange={handleInputChange}
                      placeholder="Mensah & Partners"
                      className="py-3 rounded-xl border-border bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-foreground">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+233 30 293 8472"
                      className="py-3 rounded-xl border-border bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your practice and how we can support you..."
                    rows={5}
                    required
                    className="w-full p-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-base transition-all leading-relaxed"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl shadow-sm transition-all text-base"
                  >
                    Send Inquiry Message
                  </Button>
                </div>
              </form>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
