import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Truck, Zap, Warehouse, MapPin, Globe2, Snowflake, ShieldCheck, Box } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-slate-50 dark:bg-slate-950 py-16 md:py-24 border-b border-border">
        <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Our <span className="text-primary">Services</span>
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Comprehensive, end-to-end logistics solutions tailored to meet the unique demands of your enterprise.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 md:py-24 bg-white dark:bg-black">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ServiceDetailCard
              icon={<Truck className="w-10 h-10 text-primary" />}
              title="Full Truckload (FTL)"
              description="Dedicated transport for large shipments requiring a full truck. Optimal for high volume, direct-to-destination freight."
              features={["Dedicated fleet", "Direct routing", "High security", "Scalable capacity"]}
            />
            <ServiceDetailCard
              icon={<Box className="w-10 h-10 text-secondary" />}
              title="Less Than Truckload (LTL)"
              description="Cost-effective solution for smaller shipments that don't require a full trailer. Pay only for the space you use."
              features={["Cost efficiency", "Flexible scheduling", "Consolidated freight", "Regular routes"]}
            />
            <ServiceDetailCard
              icon={<Zap className="w-10 h-10 text-primary" />}
              title="Express Delivery"
              description="Time-critical shipping for urgent consignments. Expedited handling and routing to meet strict deadlines."
              features={["Priority handling", "Guaranteed delivery windows", "Dedicated support", "Air/Ground hybrid"]}
            />
            <ServiceDetailCard
              icon={<Warehouse className="w-10 h-10 text-secondary" />}
              title="Warehousing & Distribution"
              description="Secure storage and inventory management facilities strategically located for optimal distribution."
              features={["Secure facilities", "Inventory management", "Cross-docking", "Pick and pack"]}
            />
            <ServiceDetailCard
              icon={<MapPin className="w-10 h-10 text-primary" />}
              title="Last Mile Delivery"
              description="The final step of the delivery process from distribution center to the end customer's doorstep."
              features={["Route optimization", "Proof of delivery", "Customer scheduling", "Returns management"]}
            />
            <ServiceDetailCard
              icon={<Globe2 className="w-10 h-10 text-secondary" />}
              title="Cross-Border Freight"
              description="Seamless international transport solutions managing customs clearance and compliance."
              features={["Customs brokerage", "Regulatory compliance", "International tracking", "Multi-modal transport"]}
            />
            <ServiceDetailCard
              icon={<Snowflake className="w-10 h-10 text-primary" />}
              title="Cold Chain Logistics"
              description="Temperature-controlled transport and storage for perishable goods, pharmaceuticals, and sensitive freight."
              features={["Temperature monitoring", "Specialized fleet", "Compliance reporting", "Risk management"]}
            />
            <ServiceDetailCard
              icon={<ShieldCheck className="w-10 h-10 text-secondary" />}
              title="Specialized Transport"
              description="Custom solutions for oversized, hazardous, or high-value cargo requiring special handling."
              features={["Oversized cargo handling", "Hazardous materials (Hazmat)", "High-security transport", "Custom routing plans"]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-spd text-white">
        <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Require a custom solution?</h2>
          <p className="max-w-[600px] text-white/80 md:text-lg">
            Contact our logistics experts to design a supply chain strategy tailored to your specific requirements.
          </p>
          <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-primary mt-4">
            <Link href="/contact">Contact Our Experts</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ServiceDetailCard({ 
  icon, 
  title, 
  description, 
  features 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  features: string[] 
}) {
  return (
    <div className="flex flex-col p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
      <div className="mb-6">{icon}</div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground mb-6 flex-1">{description}</p>
      <div>
        <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-slate-500">Key Features</h4>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
