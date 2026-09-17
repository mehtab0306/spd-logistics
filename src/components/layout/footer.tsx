import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t">
      <div className="h-1 w-full bg-gradient-to-r from-spd-red via-purple-500 to-spd-blue"></div>
      
      <div className="reveal-init reveal-up container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3.5 mb-5 group">
              <div className="p-1.5 bg-white rounded-2xl shadow-sm border border-slate-200/90 dark:border-slate-700/80 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                <img
                  src="/images/spd-logo.jpg"
                  alt="SPD Logistics - Super Pak Data Goods Transport Co. Est. 1996"
                  className="h-11 sm:h-12 w-auto object-contain rounded-xl"
                />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight leading-none block">
                  <span className="text-spd-red">SPD </span>
                  <span className="text-spd-blue">LOGISTICS</span>
                </span>
                <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase mt-1">Super Pak Data &bull; Est. 1996</p>
              </div>
            </Link>
            <p className="text-xs text-muted-foreground mb-4">
              Super Pak Data Goods Transport Co. — Commercial freight and logistics infrastructure operating nationwide across Pakistan since 1996.
            </p>
            <div className="text-xs space-y-1.5 text-muted-foreground">
              <p><strong className="text-foreground">Owner:</strong> Hammad Faisal Bhatti</p>
              <p><strong className="text-foreground">Phone:</strong> <a href="tel:03252024433" className="text-spd-red font-bold hover:underline">0325 2024433</a></p>
              <p><strong className="text-foreground">Email:</strong> <a href="mailto:superpakdatawale@gmail.com" className="text-spd-blue font-bold hover:underline">superpakdatawale@gmail.com</a></p>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Executive Leadership</h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <strong className="text-foreground block">Hammad Faisal Bhatti</strong>
                <span>Owner / Managing Director</span>
              </li>
              <li>
                <strong className="text-foreground block">Faisal Hussain Bhatti</strong>
                <span>Founder / CEO</span>
              </li>
              <li className="pt-2">
                <a 
                  href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-[#25D366] font-bold hover:underline"
                >
                  WhatsApp: 0325 2024433
                </a>
              </li>
            </ul>
          </div>

          {/* Warehouse Locations */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Warehouses</h3>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div>
                <p className="font-bold text-foreground">1. Karachi Warehouse</p>
                <p className="mt-0.5 leading-relaxed">
                  Plot No 9, Gate No 1, Street No 4 Truck Stand, Hawksbay Rd, Karachi
                </p>
                <a 
                  href="https://maps.app.goo.gl/GMiBWWiCET8apVMr7" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 text-spd-blue font-bold hover:underline mt-1"
                >
                  <MapPin className="w-3.5 h-3.5" /> View on Google Maps
                </a>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="font-bold text-foreground">2. Lahore Warehouse</p>
                <p className="mt-0.5">Central Punjab Commercial Transport Terminal</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Direct Contact</h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center">
                <Phone className="h-4 w-4 text-spd-red mr-2 flex-shrink-0" />
                <a href="tel:03252024433" className="font-bold text-foreground hover:text-spd-red transition-colors">
                  0325 2024433 (Hammad Faisal)
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 text-spd-blue mr-2 flex-shrink-0" />
                <a href="tel:03002024433" className="font-bold text-foreground hover:text-spd-blue transition-colors">
                  0300 2024433 (Faisal Hussain)
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                <a href="mailto:superpakdatawale@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors font-medium break-all">
                  superpakdatawale@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} SPD Logistics. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
