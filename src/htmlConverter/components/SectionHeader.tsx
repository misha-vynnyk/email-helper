import React from "react";

export interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div className='flex items-center gap-4 mb-4'>
      <div className='flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary'>{icon}</div>
      <div>
        <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
        {subtitle && <p className='text-xs text-muted-foreground'>{subtitle}</p>}
      </div>
    </div>
  );
}
