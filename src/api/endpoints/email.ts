/**
 * Email API Endpoints
 */

import { apiClient } from '../client';

export interface SendEmailPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
  password: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  message: string;
}

export const emailEndpoints = {
  send: (data: SendEmailPayload) =>
    apiClient.post<SendEmailResponse>('/api/email/send', data),

  checkStatus: () =>
    apiClient.get<{ status: 'online' | 'offline' }>('/api/email/status'),
};
