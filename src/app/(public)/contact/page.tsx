"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MapPin, Phone, Mail, Send, MessageCircle, Building2, ShieldCheck, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email address is required'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      message: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          subject: 'Website Freight Inquiry',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsSubmitted(true);
        toast.success("Message sent successfully!", {
          description: "Delivered to superpakdatawale@gmail.com",
        });
        form.reset();
      } else {
        toast.error("Submission failed", {
          description: data.message || "Please check your inputs and try again.",
        });
      }
    } catch {
      toast.error("Network Error", {
        description: "Unable to send message right now. You can also reach us directly via WhatsApp at 0325 2024433.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      
      {/* Header Section with Original Logo */}
      <section className="py-16 md:py-20 bg-white dark:bg-[#111827] border-b border-border text-center">
        <div className="container px-4 md:px-6 mx-auto space-y-4">
          <div className="inline-block transition-transform duration-300 hover:scale-105">
            <img
              src="/images/spd-logo.jpg"
              alt="SPD Super Pak Data Goods Transport Co. Est. 1996"
              className="h-24 sm:h-32 w-auto object-contain mx-auto rounded-2xl shadow-md border border-slate-200/80"
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-spd-red/10 text-spd-red font-bold text-xs uppercase tracking-wider">
            Super Pak Data Goods Transport Co. &bull; Est. 1996
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            Contact SPD Logistics
          </h1>
          <p className="max-w-[650px] mx-auto text-muted-foreground text-sm md:text-base font-medium">
            Direct communication with executive ownership, cargo dispatchers, and central logistics terminals.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-border">
            <Mail className="w-3.5 h-3.5 text-spd-blue" />
            <span>Official Dispatch:</span>
            <a href="mailto:superpakdatawale@gmail.com" className="text-spd-blue font-bold hover:underline">
              superpakdatawale@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* Main Content: Info & Form */}
      <section className="py-12 md:py-20">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid lg:grid-cols-3 gap-10">
            
            {/* Contact & Terminal Info Sidebar */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Executive Management Card */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-slate-950 dark:text-white">Executive Management</h3>
                <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-border shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-spd-red/10 text-spd-red flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Owner / Managing Director</p>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">Hammad Faisal Bhatti</p>
                      <a href="tel:03252024433" className="font-mono font-bold text-sm text-spd-red hover:underline block mt-0.5">
                        0325 2024433
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3 border-t border-border">
                    <div className="w-9 h-9 rounded-xl bg-spd-blue/10 text-spd-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Founder / CEO</p>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">Faisal Hussain Bhatti</p>
                      <a href="tel:03002024433" className="font-mono font-bold text-sm text-spd-blue hover:underline block mt-0.5">
                        0300 2024433
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3 border-t border-border">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Official Company Email</p>
                      <a href="mailto:superpakdatawale@gmail.com" className="font-bold text-xs text-spd-blue hover:underline break-all block mt-0.5">
                        superpakdatawale@gmail.com
                      </a>
                    </div>
                  </div>

                  {/* Primary WhatsApp Action Button */}
                  <a
                    href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20am%20contacting%20regarding%20SPD%20Logistics%20services."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp (0325 2024433)</span>
                  </a>
                </div>
              </div>

              {/* Commercial Warehouses Card */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-slate-950 dark:text-white">Commercial Terminals</h3>
                <div className="space-y-3.5">
                  
                  {/* Karachi Warehouse */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border-2 border-spd-red/30 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-spd-red font-bold text-sm">
                        <Building2 className="w-4 h-4" />
                        <h4>1. Karachi Warehouse</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Operational</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Plot No 9, Gate No 1, Street No 4 Truck Stand, Hawksbay Rd, Karachi
                    </p>
                    <a
                      href="https://maps.app.goo.gl/GMiBWWiCET8apVMr7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-spd-blue hover:underline pt-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-spd-red" /> View on Google Maps &rarr;
                    </a>
                  </div>

                  {/* Lahore Warehouse */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border-2 border-spd-blue/30 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-spd-blue font-bold text-sm">
                        <Building2 className="w-4 h-4" />
                        <h4>2. Lahore Warehouse</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Operational</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Central Punjab Commercial Transport Terminal & Consolidation Hub. (Exact plot details to be announced soon).
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Contact Form Connected to superpakdatawale@gmail.com */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-border bg-white dark:bg-[#111827] overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-spd-red via-purple-600 to-spd-blue"></div>
                <CardContent className="p-6 sm:p-10">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">Send Freight Message</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Dispatched directly to <strong className="text-spd-blue">superpakdatawale@gmail.com</strong>
                      </p>
                    </div>
                    <img 
                      src="/images/spd-logo.jpg" 
                      alt="SPD Logo" 
                      className="h-14 w-auto object-contain rounded-xl shadow-sm border border-slate-200/80 bg-white p-1 hidden sm:block" 
                    />
                  </div>

                  {isSubmitted && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" />
                      <div>
                        <h4 className="font-bold text-sm">Message Sent Successfully!</h4>
                        <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                          Thank you! Your inquiry has been dispatched automatically to <strong>superpakdatawale@gmail.com</strong>.
                          Our executive dispatch team will contact you shortly.
                        </p>
                      </div>
                    </div>
                  )}

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Customer / Sender Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Hammad Faisal / Company Name" className="h-12 font-medium" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Phone / WhatsApp Number</FormLabel>
                              <FormControl>
                                <Input placeholder="0325 2024433" className="h-12 font-medium" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="your.email@example.com" type="email" className="h-12 font-medium" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Cargo & Shipment Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your consignment type, cargo weight, pickup origin, destination warehouse, and special dispatch instructions..." 
                                className="min-h-[150px] resize-none font-medium text-sm"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                        <Button 
                          type="submit" 
                          size="lg" 
                          disabled={isSubmitting}
                          className="w-full sm:w-auto bg-spd-red hover:bg-spd-red/90 text-white font-extrabold h-12 px-8 shadow-md flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isSubmitting ? "Dispatching Message..." : "Submit Inquiry"}</span>
                        </Button>
                        <a
                          href="https://wa.me/923252024433?text=Assalam-o-Alaikum%20Hammad%20Sahab,%20I%20am%20contacting%20regarding%20SPD%20Logistics%20services."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>WhatsApp (0325 2024433)</span>
                        </a>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
