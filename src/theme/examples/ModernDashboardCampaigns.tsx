import { EmailCampaign } from "./mockData";
import { Mail, Clock, CheckCircle, BarChart3, Users } from "lucide-react";

export const ModernDashboardCampaigns = ({ campaigns }: { campaigns: EmailCampaign[] }) => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {campaigns.map((camp) => (
        <div key={camp.id} className='bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:border-border hover:shadow-md transition-all flex flex-col h-full'>
          <div className='flex justify-between items-start mb-4'>
            <h3 className='font-bold text-card-foreground text-lg leading-tight'>{camp.name}</h3>
            {camp.status === "sent" && <CheckCircle className='text-primary w-5 h-5 shrink-0' />}
            {camp.status === "scheduled" && <Clock className='text-amber-500 w-5 h-5 shrink-0' />}
            {camp.status === "draft" && <Mail className='text-muted-foreground w-5 h-5 shrink-0' />}
          </div>

          <div className='flex items-center gap-2 text-sm text-muted-foreground mb-6'>
            <Users className='w-4 h-4' />
            <span>{camp.recipientCount.toLocaleString()} recipients</span>
          </div>

          <div className='mt-auto pt-4 border-t border-border/50'>
            {camp.status === "sent" ? (
              <div className='flex justify-between items-end'>
                <div>
                  <p className='text-xs text-muted-foreground mb-1'>Open Rate</p>
                  <p className='text-lg font-semibold text-card-foreground'>{camp.openRate}%</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground mb-1'>Click Rate</p>
                  <p className='text-lg font-semibold text-card-foreground'>{camp.clickRate}%</p>
                </div>
                <div className='p-2 bg-primary/10 text-primary rounded-lg'>
                  <BarChart3 className='w-5 h-5' />
                </div>
              </div>
            ) : (
              <div className='flex justify-between items-center'>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${camp.status === "scheduled" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>{camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}</span>
                <span className='text-xs text-muted-foreground'>Updated {new Date(camp.lastUpdated).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
