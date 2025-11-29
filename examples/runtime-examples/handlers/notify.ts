/**
 * Example notification handler with hooks
 */

import type { Handler } from '@gati-framework/runtime';

// Send notification with hooks
export const sendNotification: Handler = async (req, res, gctx, lctx) => {
  // Register before hook for validation
  lctx.lifecycle.onCleanup(async () => {
    console.log('Cleaning up notification resources');
  });

  const { email, subject, message } = req.body;
  
  // Validate input
  if (!email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Send email via module
  const emailService = gctx.modules['email'] as any;
  await emailService.sendEmail(email, subject, message);

  res.json({ success: true, sentAt: Date.now() });
};
