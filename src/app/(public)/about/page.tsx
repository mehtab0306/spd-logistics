import React from 'react';
import { APP_NAME } from '@/lib/constants';
import { Target, Lightbulb, ShieldCheck, Gem } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-slate-50 dark:bg-slate-950 py-16 md:py-24 border-b border-border">
        <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
            About <span className="gradient-spd-text">{APP_NAME}</span>
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Delivering excellence through innovative logistics solutions and unwavering commitment to reliability.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 bg-white dark:bg-black">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">Our Mission</div>
              <h2 className="text-3xl font-bold tracking-tighter">Empowering Supply Chains</h2>
              <p className="text-muted-foreground text-lg/relaxed">
                To provide seamless, efficient, and reliable logistics solutions that empower businesses to scale their operations without borders. We strive to be the invisible yet indispensable backbone of your supply chain.
              </p>
            </div>
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-secondary/10 px-3 py-1 text-sm text-secondary font-medium">Our Vision</div>
              <h2 className="text-3xl font-bold tracking-tighter">Shaping the Future of Logistics</h2>
              <p className="text-muted-foreground text-lg/relaxed">
                To be the most trusted and innovative logistics partner globally, setting industry standards for transparency, speed, and customer satisfaction through cutting-edge technology and unparalleled service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-950">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">Our Core Values</h2>
            <p className="text-muted-foreground mt-4 max-w-[600px] mx-auto">
              The principles that guide every decision, delivery, and interaction.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <ValueCard 
              icon={<ShieldCheck className="w-8 h-8 text-primary" />}
              title="Reliability"
              description="Consistent, dependable service you can trust for your most critical shipments."
            />
            <ValueCard 
              icon={<Target className="w-8 h-8 text-secondary" />}
              title="Transparency"
              description="Clear communication and real-time visibility throughout the logistics process."
            />
            <ValueCard 
              icon={<Gem className="w-8 h-8 text-primary" />}
              title="Excellence"
              description="A relentless pursuit of the highest quality in every aspect of our operations."
            />
            <ValueCard 
              icon={<Lightbulb className="w-8 h-8 text-secondary" />}
              title="Innovation"
              description="Leveraging modern technology to solve complex logistical challenges efficiently."
            />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-24 bg-white dark:bg-black">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tighter mb-6">Our Leadership Team</h2>
          <div className="p-12 border border-dashed rounded-xl border-border bg-slate-50/50 dark:bg-slate-900/50 max-w-3xl mx-auto">
            <p className="text-muted-foreground font-medium">Our team details will be updated soon.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
