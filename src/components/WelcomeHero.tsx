"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";

export default function WelcomeHero() {
  const { subjects, notes, noteLinks } = useStore();
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <section className="mb-8">
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)] p-8 lg:p-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(162, 155, 254, 0.08), rgba(0, 184, 148, 0.06))",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Decorative blur */}
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--accent-primary), transparent)" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--subject-physiology), transparent)" }}
        />

        <div className="relative z-10">
          <p className="text-sm font-medium text-[var(--accent-secondary)] mb-1">{greeting} 👋</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-3">
            Welcome to <span style={{ color: "var(--accent-secondary)" }}>MedVault</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-base max-w-2xl leading-relaxed">
            Your intelligent medical knowledge base. Organize notes by subject and topic,
            link concepts together, and study smarter with your AI Co-pilot.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { label: "Subjects", value: subjects.length.toString(), icon: "📂" },
              { label: "Notes", value: notes.length.toString(), icon: "📝" },
              { label: "Links", value: noteLinks.length.toString(), icon: "🔗" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] glass hover-lift cursor-default"
              >
                <span className="text-xl">{stat.icon}</span>
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)] leading-none">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
