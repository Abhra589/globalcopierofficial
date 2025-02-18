import { supabase } from "@/integrations/supabase/client";

interface WhatsAppMessage {
  to: string;
  template?: string;
  text?: string;
  silent?: boolean;
}

export class WhatsAppBusinessService {
  private static async getApiCredentials() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      return null;
    } catch (error) {
      console.error('Error in getApiCredentials:', error);
      return null;
    }
  }

  public static async sendMessage({ to, template, text, silent = false }: WhatsAppMessage) {
    try {
      await this.getApiCredentials();
      
      if (text && !silent) {
        // Only open WhatsApp in new window for non-silent messages
        const cleanedNumber = to.replace(/\D/g, '');
        const formattedNumber = cleanedNumber.startsWith('91') ? cleanedNumber : `91${cleanedNumber}`;
        const encodedMessage = encodeURIComponent(text);
        window.open(`https://wa.me/${formattedNumber}?text=${encodedMessage}`, '_blank');
        return { success: true, fallback: true };
      } else if (text && silent) {
        // For silent messages, use the Edge Function
        const { data, error } = await supabase.functions.invoke('send-whatsapp', {
          body: JSON.stringify({
            to: to,
            message: text
          })
        });
        
        if (error) {
          console.error('Error sending WhatsApp message:', error);
          throw error;
        }
        
        return { success: true, silent: true };
      }
      
      throw new Error('Message text is required');
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }
}