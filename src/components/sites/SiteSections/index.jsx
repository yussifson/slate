import React, { lazy } from 'react';

// Using dynamic imports for section components
const HeroSection = lazy(() => import('./HeroSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load HeroSection</div> })));
const FeaturesSection = lazy(() => import('./FeaturesSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load FeaturesSection</div> })));
const TestimonialsSection = lazy(() => import('./TestimonialsSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load TestimonialsSection</div> })));
const FaqSection = lazy(() => import('./FaqSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load FaqSection</div> })));
const StatsSection = lazy(() => import('./StatsSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load StatsSection</div> })));
const CtaSection = lazy(() => import('./CtaSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load CtaSection</div> })));
const ContactSection = lazy(() => import('./ContactSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load ContactSection</div> })));
const TeamSection = lazy(() => import('./TeamSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load TeamSection</div> })));
const PricingSection = lazy(() => import('./PricingSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load PricingSection</div> })));
const GallerySection = lazy(() => import('./GallerySection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load GallerySection</div> })));
const LogosSection = lazy(() => import('./LogosSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load LogosSection</div> })));
const TimelineSection = lazy(() => import('./TimelineSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load TimelineSection</div> })));
const VideoSection = lazy(() => import('./VideoSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load VideoSection</div> })));
const FormSection = lazy(() => import('./FormSection').catch(() => ({ default: () => <div className="p-8 text-center text-red-500">Failed to load FormSection</div> })));
const BookingSection = lazy(() => import('./BookingSection'));
const ProductsSection = lazy(() => import('./ProductsSection'));
const MenuSection = lazy(() => import('./MenuSection'));
const JobsSection = lazy(() => import('./JobsSection'));
const BlogSection = lazy(() => import('./BlogSection'));
const MapSection = lazy(() => import('./MapSection'));
const ChatSection = lazy(() => import('./ChatSection'));

export const SECTION_REGISTRY = {
  hero: { component: HeroSection, label: 'Hero Banner' },
  features: { component: FeaturesSection, label: 'Features List' },
  testimonials: { component: TestimonialsSection, label: 'Testimonials' },
  faq: { component: FaqSection, label: 'FAQ' },
  stats: { component: StatsSection, label: 'Statistics' },
  cta: { component: CtaSection, label: 'Call to Action' },
  contact: { component: ContactSection, label: 'Contact Info' },
  team: { component: TeamSection, label: 'Team Members' },
  pricing: { component: PricingSection, label: 'Pricing Plans' },
  gallery: { component: GallerySection, label: 'Image Gallery' },
  logos: { component: LogosSection, label: 'Client Logos' },
  timeline: { component: TimelineSection, label: 'Timeline / Roadmap' },
  video: { component: VideoSection, label: 'Video Embed' },
  form: { component: FormSection, label: 'Custom Form' },
  booking: { component: BookingSection, label: 'Booking' },
  products: { component: ProductsSection, label: 'Products' },
  menu: { component: MenuSection, label: 'Restaurant Menu' },
  jobs: { component: JobsSection, label: 'Job Openings' },
  blog: { component: BlogSection, label: 'Blog Posts' },
  map: { component: MapSection, label: 'Location Map' },
  chat: { component: ChatSection, label: 'Live Chat' }
};

export function getSectionComponent(type) {
  return SECTION_REGISTRY[type]?.component || null;
}
