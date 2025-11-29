/**
 * Example email module - Simulated email service
 */

interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  sentAt: number;
}

const sentEmails: EmailMessage[] = [];

export const emailModule = {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    sentEmails.push({
      to,
      subject,
      body,
      sentAt: Date.now(),
    });
  },

  async getSentEmails(): Promise<EmailMessage[]> {
    return [...sentEmails];
  },
};
