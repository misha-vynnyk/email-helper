export interface EmailCampaign {
  id: string;
  name: string;
  status: "draft" | "sent" | "scheduled";
  recipientCount: number;
  openRate?: number;
  clickRate?: number;
  lastUpdated: string;
}

export const MOCK_CAMPAIGNS: EmailCampaign[] = [
  {
    id: "1",
    name: "Spring Sale 2026",
    status: "scheduled",
    recipientCount: 15420,
    lastUpdated: "2026-02-27T10:00:00Z",
  },
  {
    id: "2",
    name: "Welcome Series - Email 1",
    status: "sent",
    recipientCount: 45000,
    openRate: 68.5,
    clickRate: 12.4,
    lastUpdated: "2026-02-25T14:30:00Z",
  },
  {
    id: "3",
    name: "Abandoned Cart Reminder",
    status: "draft",
    recipientCount: 0,
    lastUpdated: "2026-02-27T11:45:00Z",
  },
];
