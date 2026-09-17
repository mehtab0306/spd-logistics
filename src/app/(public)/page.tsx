"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Truck, 
  MapPin, 
  Warehouse, 
  Zap, 
  Shield, 
  Building2, 
  Send, 
  MessageCircle, 
  Phone,
  FileText, 
  Package, 
  Layers, 
  Route, 
  History, 
  Award, 
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedCounters } from '@/components/public/animated-counters';
import { FaqFlipCards } from '@/components/public/faq-flip-cards';
import { FleetVideoSection } from '@/components/public/fleet-video-section';
import { NasaParticles } from '@/components/public/nasa-particles';

const heroSlides = [
  {
    image: '/images/hero-slide-1.jpg',
    alt: 'SPD Logistics Commercial Cargo Fleet on Highway at Sunset',
    animationClass: 'animate-ken-burns-1',
  },
  {
    image: '/images/hero-slide-2.jpg',
    alt: 'SPD Logistics Distribution Center and Warehouse Freight Operations',
    animationClass: 'animate-ken-burns-2',
  },
  {
    image: '/images/hero-slide-3.jpg',
    alt: 'SPD Logistics Express Cargo Line-Haul Night Transport',
    animationClass: 'animate-ken-burns-3',
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
          subject: "[SPD Logistics Booking Inquiry] New Customer Request",
          message: contactMsg,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormSubmitted(true);
        toast.success("Inquiry sent successfully to superpakdatawale@gmail.com");
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setContactMsg('');
      } else {
        toast.error(data.message || "Failed to send inquiry. Please try again.");
      }
    } catch {
      toast.error("Network error. Please contact us via WhatsApp at 0325 2024433.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* 3-Image Slideshow with Smooth Crossfade & Ken Burns Motion                */}
      {/* ========================================================================= */}
      <section className="relative w-full py-16 lg:py-24 xl:py-32 overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-50 dark:from-[#0B0F19] dark:via-[#111827] dark:to-[#0B0F19] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        {/* Animated 3-Image Slideshow (Smooth Crossfade & Slow Ken Burns Pan/Zoom) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-[2600ms] ease-in-out ${
                currentSlide === idx ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className={`w-full h-full object-cover ${slide.animationClass} opacity-85 dark:opacity-75`}
              />
            </div>
          ))}

          {/* Balanced Readability Gradient Overlay - images stay clearly visible while text is crisp */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/70 dark:from-[#0B0F19]/65 dark:via-[#111827]/45 dark:to-[#0B0F19]/70 pointer-events-none z-[2] transition-colors duration-300" />
        </div>

        {/* NASA-inspired Particle Background Effect (stays strictly behind content at z-[3]) */}
        <NasaParticles theme="hero" className="z-[3] opacity-65 dark:opacity-75 pointer-events-none" particleCount={95} connectDistance={0} />

        {/* Ambient Blur Circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-spd-red/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-spd-blue/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container relative z-10 px-4 md:px-6 mx-auto flex flex-col items-center text-center animate-hero-zoom-out">
          
          {/* Original SPD Logo with Entrance Animation */}
          <div className="mb-6 transition-transform duration-300 hover:scale-105 animate-hero-logo">
            <img
              src="/images/spd-logo.jpg"
              alt="SPD Super Pak Data Goods Transport Co. Est. 1996"
              className="h-28 sm:h-36 md:h-40 w-auto object-contain mx-auto rounded-2xl shadow-md border border-slate-200/80 bg-white"
            />
          </div>

          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spd-red/10 text-spd-red dark:bg-spd-red/20 font-bold text-xs uppercase tracking-wider border border-spd-red/20">
              Super Pak Data Goods Transport Co. &bull; Est. 1996
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 dark:text-white animate-hero-heading">
              <span className="gradient-spd-text">SPD LOGISTICS</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 animate-hero-paragraph">
              Commercial Transport & Nationwide Freight Solutions
            </p>
            <p className="mx-auto max-w-[760px] text-slate-600 dark:text-slate-300 text-sm md:text-lg font-medium leading-relaxed">
              Full truckload movements, verified bilty booking, transparent milestone tracking, and dedicated branch cash registers between Lahore and Karachi.
            </p>

            {/* Warehouse Availability Pill */}
            <div className="pt-2">
              <div className="inline-flex flex-wrap items-center justify-center gap-3 p-2 px-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm text-xs text-slate-800 dark:text-slate-200">
                <span className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Warehouse Hubs:</span>
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Lahore Warehouse
                </span>
                <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Karachi Warehouse
                </span>
                <a href="#map-section" className="text-spd-blue font-extrabold hover:underline ml-1 text-[11px]">View Map &rarr;</a>
              </div>
            </div>
          </div>
          
          {/* Tracking Search Form */}
          <div className="w-full max-w-md mt-8 space-y-4 animate-hero-btn-1" id="tracking-section">
            <form action="/tracking" method="GET" className="flex flex-col sm:flex-row gap-2">
              <Input
                name="id"
                className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 text-sm font-medium shadow-sm"
                placeholder="Enter Bilty # or Tracking ID"
                required
              />
              <Button type="submit" size="lg" className="bg-spd-red hover:bg-spd-redHover text-white font-bold h-12 px-6 shadow-md hover-lift">
                Track
              </Button>
            </form>
          </div>

          {/* Hero Action Buttons: Book Shipment & Track Consignment (Red and White Theme) */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button asChild size="lg" className="bg-spd-red hover:bg-spd-redHover text-white font-extrabold text-sm h-12 px-8 rounded-xl shadow-lg hover-lift transition-all animate-hero-btn-2 btn-glow-red flex items-center gap-2.5">
              <Link href="#contact-section">
                <span>Book Shipment</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            
            {/* High-contrast Track Consignment button in light mode & dark mode */}
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="bg-white hover:bg-slate-100 text-slate-950 border-2 border-slate-300 dark:border-slate-600 font-extrabold text-sm h-12 px-8 rounded-xl shadow-md dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white transition-all animate-hero-btn-3 hover-lift btn-glow-blue flex items-center gap-2.5"
            >
              <Link href="#tracking-section">
                <span>Track Consignment</span>
                <Search className="w-4 h-4 ml-1 text-spd-red" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Animated Metrics Counters */}
      <AnimatedCounters />

      {/* Dedicated Highway Freight Fleet Video Showcase Section */}
      <FleetVideoSection />

      {/* ========================================================================= */}
      {/* 2. ABOUT SECTION (BIGGER & DETAILED)                                      */}
      {/* Preserves ownership cards + Adds detailed history, experience & services */}
      {/* ========================================================================= */}
      <section id="about-section" className="w-full py-20 lg:py-28 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-[2px] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-10">
        <div className="container px-4 md:px-6 mx-auto">
          
          {/* Section Header */}
          <div className="reveal-init reveal-slide-down flex flex-col items-center justify-center space-y-3 text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spd-red/10 text-spd-red font-extrabold text-xs uppercase tracking-wider">
              About Super Pak Data Goods Transport Co.
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl text-slate-950 dark:text-white">
              Pioneering Logistics Excellence Since 1996
            </h2>
            <p className="max-w-[760px] text-slate-600 dark:text-slate-400 text-sm sm:text-base font-normal leading-relaxed">
              For over 28 years, SPD Logistics has stood as a cornerstone of Pakistan’s commercial transportation infrastructure, bridging markets and driving industrial growth.
            </p>
          </div>

          {/* 6 Key Pillars of SPD Logistics Experience & Infrastructure */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            
            {/* 1. Company History */}
            <div className="reveal-init reveal-slide-left stagger-1 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-hover-lift shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-spd-red/10 text-spd-red flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Company History</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Founded in 1996 by Faisal Hussain Bhatti, SPD began with a vision to streamline commercial freight routes connecting Karachi Port to Punjab’s major trade markets.
              </p>
            </div>

            {/* 2. Established 1996 & 28+ Years Experience */}
            <div className="reveal-init reveal-slide-up stagger-2 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-hover-lift shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-spd-blue/10 text-spd-blue flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Goods Transportation Experience</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Nearly three decades of proven operational excellence handling raw materials, manufactured textiles, industrial machinery, and consumer commodities safely and on time.
              </p>
            </div>

            {/* 3. Nationwide Logistics Solutions */}
            <div className="reveal-init reveal-slide-right stagger-3 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-hover-lift shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-spd-red/10 text-spd-red flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <Route className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Nationwide Logistics Solutions</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Extensive trunk route network covering Karachi, Hyderabad, Sukkur, Multan, Faisalabad, Lahore, Gujranwala, Rawalpindi/Islamabad, and northern distribution hubs.
              </p>
            </div>

            {/* 4. Strategic Warehouse Operations */}
            <div className="reveal-init reveal-slide-left stagger-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-hover-lift shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-spd-blue/10 text-spd-blue flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Warehouse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Warehouse Operations</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                High-capacity transit terminals in Karachi (Hawksbay Truck Stand) and Lahore, equipped for cross-docking, consolidation, short-term holding, and secure night loading.
              </p>
            </div>

            {/* 5. Bilty Tracking System */}
            <div className="reveal-init reveal-slide-up stagger-5 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-hover-lift shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-spd-red/10 text-spd-red flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Bilty Tracking System</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Modern computerized bilty issuance, digital booking registers, milestone verification, and real-time online tracking ensuring total shipment accountability.
              </p>
            </div>

            {/* 6. Corporate Transport Services */}
            <div className="reveal-init reveal-slide-right stagger-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 card-hover-lift shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-spd-blue/10 text-spd-blue flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Corporate Transport Services</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Dedicated fleet allocation, contracted freight rates, customized SLAs, and transparent branch cash accounting designed specifically for corporate manufacturers and exporters.
              </p>
            </div>

          </div>

          {/* OWNED & MANAGED BY SECTION (Preserved Executive Leadership Cards) */}
          <div id="ownership-section" className="pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="reveal-init reveal-slide-down text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spd-blue/10 text-spd-blue font-extrabold text-xs uppercase tracking-wider mb-2">
                Executive Leadership
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-slate-950 dark:text-white">
                Owned & Managed By
              </h3>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 items-stretch">
              
              {/* Person 1: Faisal Hussain Bhatti (Founder / CEO — Father) */}
              <div className="reveal-init reveal-slide-left flex flex-col bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-spd-blue/30 overflow-hidden shadow-xl card-hover-lift">
                <div className="relative w-full h-[380px] sm:h-[440px] bg-gradient-to-b from-slate-900 via-slate-950 to-black overflow-hidden flex items-center justify-center img-slow-zoom">
                  <img
                    src="/images/faisal-hussain-bhatti.jpg"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 pointer-events-none"
                  />
                  <img
                    src="/images/faisal-hussain-bhatti.jpg"
                    alt="Faisal Hussain Bhatti — Founder / CEO"
                    className="relative z-10 w-full h-full object-contain p-3"
                  />
                  <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none"></div>
                  <div className="absolute bottom-4 left-5 right-5 z-30 text-white">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-spd-blue text-white inline-block mb-1.5 shadow">
                      Founder / CEO
                    </span>
                    <h4 className="text-2xl font-black text-white leading-tight">Faisal Hussain Bhatti</h4>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-extrabold mb-1">Founding Vision</p>
                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                      Founder and Chief Executive Officer who established Super Pak Data Goods Transport Co. in 1996, building foundational commercial freight corridors.
                    </p>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Direct Phone:</span>
                      <a href="tel:03002024433" className="font-mono font-black text-sm text-spd-blue hover:underline">
                        0300 2024433
                      </a>
                    </div>
                    <a
                      href="tel:03002024433"
                      className="w-full py-3 px-4 rounded-xl bg-spd-blue hover:bg-spd-blueHover text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all btn-glow-blue"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Faisal Hussain (0300 2024433)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Person 2: Hammad Faisal Bhatti (Owner / Managing Director — Son) */}
              <div className="reveal-init reveal-slide-right flex flex-col bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-spd-red/30 overflow-hidden shadow-xl card-hover-lift">
                <div className="relative w-full h-[380px] sm:h-[440px] bg-gradient-to-b from-slate-900 via-slate-950 to-black overflow-hidden flex items-center justify-center img-slow-zoom">
                  <img
                    src="/images/hammad-faisal-bhatti.jpg"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 pointer-events-none"
                  />
                  <img
                    src="/images/hammad-faisal-bhatti.jpg"
                    alt="Hammad Faisal Bhatti — Owner / Managing Director"
                    className="relative z-10 w-full h-full object-contain p-3"
                  />
                  <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none"></div>
                  <div className="absolute bottom-4 left-5 right-5 z-30 text-white">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-spd-red text-white inline-block mb-1.5 shadow">
                      Owner / Managing Director
                    </span>
                    <h4 className="text-2xl font-black text-white leading-tight">Hammad Faisal Bhatti</h4>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-extrabold mb-1">Executive Management</p>
                    <p className="text-sm font-semibold text-foreground leading-relaxed">
                      Managing Director directing nationwide line-haul operations, fleet deployment, commercial terminals, and corporate accounts.
                    </p>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Direct Phone:</span>
                      <a href="tel:03252024433" className="font-mono font-black text-sm text-spd-red hover:underline">
                        0325 2024433
                      </a>
                    </div>
                    <a
                      href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20am%20contacting%20regarding%20SPD%20Logistics%20services."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all btn-glow-red"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Hammad Faisal (0325 2024433)</span>
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SERVICES SECTION (7 Cards: Requested Exact Services)                   */}
      {/* ========================================================================= */}
      <section id="services-section" className="w-full py-20 lg:py-28 bg-slate-50/75 dark:bg-[#0e1422]/75 backdrop-blur-[2px] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-10">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="reveal-init reveal-blur flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spd-blue/10 text-spd-blue font-extrabold text-xs uppercase tracking-wider">
              Comprehensive Transport Solutions
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl text-slate-950 dark:text-white">
              Our Professional Logistics Services
            </h2>
            <p className="max-w-[700px] text-slate-600 dark:text-slate-400 text-sm md:text-base font-normal">
              Tailored commercial transport services engineered for efficiency, speed, and reliable consignment delivery across Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            
            {/* 1. Full Truck Load */}
            <div className="reveal-init reveal-up stagger-1 group flex flex-col justify-between p-6 bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:-translate-y-2 hover:border-spd-red/40 dark:hover:border-spd-red/50 hover:shadow-xl transition-all duration-300 card-hover-lift">
              <div>
                <div className="w-12 h-12 rounded-xl bg-spd-red/10 text-spd-red flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Full Truck Load</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Dedicated vehicle allocation for direct factory-to-warehouse bulk shipments, offering exclusive payload security and non-stop point-to-point routing.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-spd-red">Dedicated Fleet</span>
                <ArrowRight className="w-4 h-4 text-spd-red" />
              </div>
            </div>

            {/* 2. Goods Transportation */}
            <div className="reveal-init reveal-up stagger-2 group flex flex-col justify-between p-6 bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:-translate-y-2 hover:border-spd-blue/40 dark:hover:border-spd-blue/50 hover:shadow-xl transition-all duration-300 card-hover-lift">
              <div>
                <div className="w-12 h-12 rounded-xl bg-spd-blue/10 text-spd-blue flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Goods Transportation</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Reliable and timely inter-city transportation for industrial, commercial, and wholesale goods connecting all major economic zones nationwide.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-spd-blue">Nationwide Network</span>
                <ArrowRight className="w-4 h-4 text-spd-blue" />
              </div>
            </div>

            {/* 3. Bilty Booking */}
            <div className="reveal-init reveal-up stagger-3 group flex flex-col justify-between p-6 bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:-translate-y-2 hover:border-spd-red/40 dark:hover:border-spd-red/50 hover:shadow-xl transition-all duration-300 card-hover-lift">
              <div>
                <div className="w-12 h-12 rounded-xl bg-spd-red/10 text-spd-red flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Bilty Booking</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Quick and accurate consignment booking with computerized bilty generation, formal freight receipts, and verified dispatch paperwork.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-spd-red">Instant Issuance</span>
                <ArrowRight className="w-4 h-4 text-spd-red" />
              </div>
            </div>

            {/* 4. Shipment Tracking */}
            <div className="reveal-init reveal-up stagger-4 group flex flex-col justify-between p-6 bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:-translate-y-2 hover:border-spd-blue/40 dark:hover:border-spd-blue/50 hover:shadow-xl transition-all duration-300 card-hover-lift">
              <div>
                <div className="w-12 h-12 rounded-xl bg-spd-blue/10 text-spd-blue flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Shipment Tracking</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Live status updates and transparent milestone tracking by entering your official Bilty Number or Tracking ID on our portal.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-spd-blue">Real-Time Status</span>
                <ArrowRight className="w-4 h-4 text-spd-blue" />
              </div>
            </div>

            {/* 5. Warehouse Services */}
            <div className="reveal-init reveal-up stagger-5 group flex flex-col justify-between p-6 bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:-translate-y-2 hover:border-spd-red/40 dark:hover:border-spd-red/50 hover:shadow-xl transition-all duration-300 card-hover-lift">
              <div>
                <div className="w-12 h-12 rounded-xl bg-spd-red/10 text-spd-red flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Warehouse className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Warehouse Services</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Secure storage, sorting, cross-docking, and cargo holding at our dual commercial facilities in Karachi (Hawksbay) and Central Lahore.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-spd-red">Secure Storage</span>
                <ArrowRight className="w-4 h-4 text-spd-red" />
              </div>
            </div>

            {/* 6. Corporate Logistics */}
            <div className="reveal-init reveal-up stagger-6 group flex flex-col justify-between p-6 bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:-translate-y-2 hover:border-spd-blue/40 dark:hover:border-spd-blue/50 hover:shadow-xl transition-all duration-300 card-hover-lift">
              <div>
                <div className="w-12 h-12 rounded-xl bg-spd-blue/10 text-spd-blue flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">Corporate Logistics</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enterprise contract partnerships featuring contracted freight lanes, dedicated account managers, transparent ledger reconciliation, and custom corporate SLAs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-spd-blue">Enterprise Solutions</span>
                <ArrowRight className="w-4 h-4 text-spd-blue" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MAP SECTION (Karachi & Lahore Warehouse Locations Together)             */}
      {/* ========================================================================= */}
      <section id="map-section" className="w-full py-20 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-[2px] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-10">
        <div className="container px-4 md:px-6 mx-auto">
          
          <div className="reveal-init reveal-slide-down text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-spd-red/10 text-spd-red font-extrabold text-xs uppercase tracking-wider mb-3">
              Strategic Commercial Infrastructure
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white">
              Karachi & Lahore Warehouse Network
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Integrated dual commercial terminal operations connecting Pakistan's prime maritime port with northern industrial distribution hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-7xl mx-auto">
            
            {/* Warehouse 1: Karachi Warehouse Card */}
            <div className="reveal-init reveal-slide-left lg:col-span-4 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 border-spd-red/30 shadow-lg card-hover-lift">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-spd-red text-white">Hub 01 &bull; Sindh</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active 24/7</span>
                </div>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white">Karachi Warehouse</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-1">Primary Coastal Port Receiving & Dispatch Facility</p>
                
                <div className="mt-5 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-spd-red flex-shrink-0 mt-0.5" />
                    <p className="font-bold text-slate-900 dark:text-white">
                      Plot No 9, Gate No 1, Street No 4 Truck Stand, Hawksbay Rd, Karachi
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                    Direct access to Karachi Port, Mauripur Road, and RCD Highway.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <a
                  href="https://maps.app.goo.gl/GMiBWWiCET8apVMr7?g_st=ic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-spd-red hover:bg-spd-redHover text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all btn-glow-red"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Open Karachi Google Map &rarr;</span>
                </a>
              </div>
            </div>

            {/* Interactive Embedded Google Map Display */}
            <div className="reveal-init reveal-zoom-in lg:col-span-4 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 relative min-h-[360px] flex flex-col card-hover-lift">
              <iframe
                title="Karachi Warehouse Google Map"
                src="https://maps.google.com/maps?q=Hawksbay+Rd,+Truck+Stand,+Karachi,+Pakistan&t=&z=14&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full min-h-[300px] flex-1 border-0"
                allowFullScreen
                loading="lazy"
              ></iframe>
              <div className="p-3 bg-slate-900 text-white text-center text-xs font-bold flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-spd-red animate-bounce" />
                <span>Karachi Hawksbay Terminal Location</span>
              </div>
            </div>

            {/* Warehouse 2: Lahore Warehouse Card */}
            <div className="reveal-init reveal-slide-right lg:col-span-4 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border-2 border-spd-blue/30 shadow-lg card-hover-lift">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-spd-blue text-white">Hub 02 &bull; Punjab</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Active 24/7</span>
                </div>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white">Lahore Warehouse</h3>
                <p className="text-xs text-muted-foreground font-semibold mt-1">Central Punjab Regional Consolidation Hub</p>
                
                <div className="mt-5 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-spd-blue flex-shrink-0 mt-0.5" />
                    <p className="font-bold text-slate-900 dark:text-white">
                      Central Punjab Commercial Transport Terminal
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                    Serving inbound and outbound dispatches across Lahore, Faisalabad, Gujranwala, Sialkot, and northern freight routes.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-center text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700">
                  Direct Line-Haul to Karachi Hub Daily
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FAQ 3D FLIP CARDS SECTION */}
      <FaqFlipCards />

      {/* ========================================================================= */}
      {/* 5. CONTACT SECTION (Connected to superpakdatawale@gmail.com)               */}
      {/* ========================================================================= */}
      <section id="contact-section" className="w-full py-20 bg-slate-50/75 dark:bg-[#0e1422]/75 backdrop-blur-[2px] border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 relative z-10">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          
          <div className="reveal-init reveal-slide-down text-center space-y-3 mb-12">
            <img
              src="/images/spd-logo.jpg"
              alt="SPD Logo"
              className="h-16 w-auto object-contain mx-auto mb-2 rounded-xl shadow-sm border border-slate-200/80 bg-white p-1"
            />
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white">Contact Us</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Send your cargo inquiry directly to <strong className="text-spd-blue">superpakdatawale@gmail.com</strong> for instant freight quotation and dispatch scheduling.
            </p>
          </div>

          <div className="reveal-init reveal-blur bg-white dark:bg-[#111827] p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl card-hover-lift">
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-12 bg-slate-50 dark:bg-slate-900 font-medium text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Phone / WhatsApp</label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0325 2024433"
                    className="h-12 bg-slate-50 dark:bg-slate-900 font-medium text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                <Input
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  type="email"
                  placeholder="your.email@example.com"
                  className="h-12 bg-slate-50 dark:bg-slate-900 font-medium text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Message</label>
                <Textarea
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="Enter details regarding your cargo consignment, goods type, bilty requirements, origin, and destination..."
                  className="min-h-[140px] bg-slate-50 dark:bg-slate-900 font-medium text-sm resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-spd-red hover:bg-spd-redHover text-white font-extrabold px-8 h-12 shadow-md flex items-center justify-center gap-2 btn-glow-red"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Dispatching Message..." : "Submit Inquiry"}</span>
                </Button>
                
                <a
                  href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20am%20contacting%20regarding%20SPD%20Logistics%20services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all h-12 btn-glow-blue"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp (0325 2024433)</span>
                </a>
              </div>

              {formSubmitted && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Thank you! Your inquiry has been sent successfully to superpakdatawale@gmail.com. Our dispatch team will contact you shortly.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. READY TO SHIP CTA SECTION                                              */}
      {/* ========================================================================= */}
      <section className="w-full py-20 gradient-spd text-white">
        <div className="reveal-init reveal-zoom-in container px-4 md:px-6 mx-auto flex flex-col items-center text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tighter sm:text-4xl md:text-5xl">
            Ready to ship with SPD Logistics?
          </h2>
          <p className="max-w-[640px] text-white/90 md:text-xl/relaxed font-medium">
            Super Pak Data Goods Transport Co. &bull; Trusted cargo freight operations across Pakistan since 1996.
          </p>
          <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-slate-100 font-extrabold h-12 px-8 shadow-xl btn-glow-red">
            <Link href="#contact-section">Book Your Consignment</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
