import { EmailCampaign } from "./mockData";

export const ClassicListCampaigns = ({ campaigns }: { campaigns: EmailCampaign[] }) => {
  return (
    <div className='w-full'>
      <div className='bg-card shadow overflow-hidden sm:rounded-md border border-border/50'>
        <ul className='divide-y divide-border/50'>
          {campaigns.map((camp) => (
            <li key={camp.id} className='hover:bg-accent/50 transition-colors'>
              <div className='px-4 py-4 sm:px-6'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium text-primary truncate'>{camp.name}</p>
                  <div className='ml-2 flex-shrink-0 flex'>
                    <p
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${camp.status === "sent" ? "bg-emerald-500/10 text-emerald-500" : camp.status === "scheduled" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                      {camp.status.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className='mt-2 sm:flex sm:justify-between'>
                  <div className='sm:flex'>
                    <p className='flex items-center text-sm text-muted-foreground'>Recipients: {camp.recipientCount.toLocaleString()}</p>
                    {camp.status === "sent" && (
                      <p className='mt-2 flex items-center text-sm text-muted-foreground sm:mt-0 sm:ml-6'>
                        Opens: {camp.openRate}% | Clicks: {camp.clickRate}%
                      </p>
                    )}
                  </div>
                  <div className='mt-2 flex items-center text-sm text-muted-foreground sm:mt-0'>
                    <p>
                      Last updated: <time dateTime={camp.lastUpdated}>{new Date(camp.lastUpdated).toLocaleDateString()}</time>
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
