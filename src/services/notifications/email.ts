import nodemailer from 'nodemailer';

const TAG = '[OmniFlow Email]';

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  recipient_email: string;
}

interface PublishNotification {
  title: string;
  url: string;
  platform: string;
  publishedAt: string;
}

export async function sendPublishNotification(
  config: EmailConfig,
  articles: PublishNotification[],
): Promise<boolean> {
  if (articles.length === 0) {
    console.log(`${TAG} SKIP: no articles to notify about.`);
    return false;
  }

  console.log(`${TAG} Connecting to ${config.smtp_host}:${config.smtp_port} as ${config.smtp_user}...`);

  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_port === 465,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
  });

  const publishedList = articles
    .map((a) => `• ${a.title}\n  Platform: ${a.platform} | ${new Date(a.publishedAt).toLocaleString('vi-VN')}\n  ${a.url}`)
    .join('\n\n');

  try {
    console.log(`${TAG} Sending email to ${config.recipient_email} for ${articles.length} articles...`);
    const info = await transporter.sendMail({
      from: config.smtp_user,
      to: config.recipient_email,
      subject: `OmniFlow AI — ${articles.length} bài viết đã được đăng tự động`,
      text: `OmniFlow AI Auto-Publish Report\n\n${articles.length} bài viết đã được tự động đăng:\n\n${publishedList}\n\n---\nOmniFlow AI News Automation`,
    });
    console.log(`${TAG} Email sent successfully! MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`${TAG} FAILED to send email: ${msg}`);
    console.log(`${TAG} Full error:`, err);
    return false;
  }
}
