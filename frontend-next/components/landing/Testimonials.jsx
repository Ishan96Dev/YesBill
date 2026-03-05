'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { assetUrl } from "../../lib/utils";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Ramesh Patel",
      role: "Milk Distributor, Ahmedabad",
      image: assetUrl("/testimonials/ramesh-patel.png"),
      content: "I used to spend hours at the end of each month manually adding up deliveries for 40+ customers. With YesBill I just tick Yes or No daily and the bill generates itself. The email invoice saves me hours every month.",
      rating: 5
    },
    {
      name: "Neha Sharma",
      role: "Working Professional, Bengaluru",
      image: assetUrl("/testimonials/neha-sharma.png"),
      content: "I track my tiffin, house cleaning, and newspaper separately. The calendar view shows exactly which days each service came. No more arguments with my doodhwala about how many days he actually delivered.",
      rating: 5
    },
    {
      name: "Ajay Verma",
      role: "Apartment Manager, Pune",
      image: assetUrl("/testimonials/ajay-verma.png"),
      content: "We replaced three different spreadsheets with YesBill. Residents get PDF invoices via email every month. The AI summary even flags when services were irregular. It's the most transparent billing tool we've used.",
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden" id="testimonials">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display">
            Trusted by daily users
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            See how YesBill simplifies life for service providers and households.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all duration-300 relative border border-gray-100 flex flex-col"
            >
              <div className="absolute top-6 right-6 p-2 bg-primary/5 rounded-full">
                <Quote className="w-6 h-6 text-primary/40" />
              </div>

              <div className="flex gap-1 mb-3 text-yellow-400">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>

              <p className="text-gray-700 text-lg mb-8 leading-relaxed italic flex-grow">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                />
                <div>
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-primary font-medium">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
