"use client";

import React, { useState, useEffect } from "react";
import { Command, Check, Plus, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { navCategories } from "@/components/nav-config";
import { Button } from "@/components/ui/button";
import { T } from "@/components/Translate";

export function QuickActionsSettings() {
  const [pinned, setPinned] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('personal_quick_actions');
      if (saved) {
        setPinned(JSON.parse(saved));
      } else {
        // Default ones that were originally hardcoded
        setPinned(["/attendance", "/leave", "/expenses"]);
      }
    } catch (e) {}
  }, []);

  const savePinned = (newPinned: string[]) => {
    setPinned(newPinned);
    localStorage.setItem('personal_quick_actions', JSON.stringify(newPinned));
    window.dispatchEvent(new Event('quickActionsUpdated'));
  };

  const togglePin = (path: string) => {
    if (pinned.includes(path)) {
      savePinned(pinned.filter(p => p !== path));
    } else {
      savePinned([...pinned, path]);
    }
  };

  // Flatten available nav items
  const availableItems = navCategories.flatMap(c => c.items);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Command size={16} className="text-[var(--brand-strong)]" />
          {/* @ts-ignore */}
          <T>Pinned Quick Actions</T>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4">
        <p className="text-sm text-[var(--text-muted)]">
          {/* @ts-ignore */}
          <T>Customize which links appear as Quick Actions in your Command Palette (Ctrl/Cmd + K).</T>
        </p>
        
        <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
          {availableItems.map((item) => {
            const isPinned = pinned.includes(item.path);
            return (
              <div 
                key={item.path} 
                className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer ${
                  isPinned 
                    ? "border-[var(--brand)] bg-[var(--brand)]/10" 
                    : "border-[var(--border-hairline)] bg-[var(--bg-hover)] hover:border-[var(--border-strong)]"
                }`}
                onClick={() => togglePin(item.path)}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isPinned ? "bg-[var(--brand)] text-white" : "bg-[var(--bg-app)] text-[var(--text-muted)]"}`}>
                    <item.icon size={16} />
                  </div>
                  <span className={`text-sm font-medium ${isPinned ? "text-[var(--brand)]" : "text-[var(--text-main)]"}`}>
                    {item.label}
                  </span>
                </div>
                {isPinned ? (
                  <Check size={16} className="text-[var(--brand)]" />
                ) : (
                  <Plus size={16} className="text-[var(--text-muted)]" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
