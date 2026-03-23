/**
 * Frontend EmailJS Service
 * Handles all email sending directly from the React Native app
 * using EmailJS (no backend required for contact forms).
 */
import emailjs from '@emailjs/browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// ─── EmailJS Config (fetched from backend) ────────────────────────
let emailjsConfig: {
  service_id: string;
  template_id: string;
  public_key: string;
} | null = null;

async function getEmailJSConfig() {
  if (emailjsConfig) return emailjsConfig;
  try {
    const cached = await AsyncStorage.getItem('emailjs_config');
    if (cached) {
      emailjsConfig = JSON.parse(cached);
      return emailjsConfig;
    }
    // Fetch from backend
    const res = await api.get('/v1/emails/emailjs-config/');
    if (res.data?.data) {
      emailjsConfig = res.data.data;
      await AsyncStorage.setItem('emailjs_config', JSON.stringify(emailjsConfig));
      return emailjsConfig;
    }
  } catch (e) {
    console.warn('EmailJS config fetch failed:', e);
  }
  return null;
}

export interface ContactFormData {
  from_name: string;
  from_email: string;
  subject: string;
  message: string;
  reply_to?: string;
}

/**
 * Send a contact form email via EmailJS (client-side, no backend).
 * EmailJS delivers it to your configured Gmail inbox.
 */
export async function sendContactEmailJS(data: ContactFormData): Promise<boolean> {
  const config = await getEmailJSConfig();

  if (!config?.service_id || !config?.public_key) {
    console.warn('EmailJS not configured. Using backend fallback.');
    return false;
  }

  try {
    await emailjs.send(
      config.service_id,
      config.template_id,
      {
        from_name: data.from_name,
        from_email: data.from_email,
        subject: data.subject,
        message: data.message,
        reply_to: data.reply_to || data.from_email,
        to_name: 'MentiQ Support',
      },
      { publicKey: config.public_key }
    );
    return true;
  } catch (e: any) {
    console.error('EmailJS send error:', e?.text || e);
    return false;
  }
}

/**
 * Submit contact form to backend (saves to DB + notifies admin via Gmail SMTP).
 * This is the primary method; EmailJS is a bonus client-side path.
 */
export async function submitContactForm(data: {
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await api.post('/v1/emails/contact/', data);
    return {
      success: true,
      message: res.data?.message || 'Message sent successfully!',
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || 'Failed to send. Please try again.',
    };
  }
}

/**
 * Get all contact messages submitted by the logged-in user.
 */
export async function getMyContactMessages() {
  const res = await api.get('/v1/emails/contact/mine/');
  return res.data?.data || [];
}
