type OrderNotificationItem = {
  title: string;
  qty: number;
  price: number;
};

export type OrderNotificationPayload = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  customerName: string;
  customerEmail?: string | null;
  phone: string;
  address: string;
  items: OrderNotificationItem[];
};

const DEFAULT_WHATSAPP_NUMBER = '9864320552';

function formatLineItems(items: OrderNotificationItem[]): string {
  if (items.length === 0) return 'No items found.';
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.title} × ${item.qty} — Rs. ${(item.price * item.qty).toFixed(2)}`
    )
    .join('\n');
}

function buildMessage(payload: OrderNotificationPayload): string {
  const placedDate = new Date(payload.createdAt);
  const formattedDate = Number.isNaN(placedDate.getTime())
    ? payload.createdAt
    : placedDate.toLocaleString();

  return [
    '*Urban Bhatti — New Order*',
    `Order ID: ${payload.id}`,
    `Status: ${payload.status}`,
    `Placed: ${formattedDate}`,
    '',
    `Customer: ${payload.customerName}`,
    payload.customerEmail ? `Email: ${payload.customerEmail}` : null,
    `Phone: ${payload.phone}`,
    `Address: ${payload.address}`,
    '',
    '*Items*',
    formatLineItems(payload.items),
    '',
    `Total: Rs. ${payload.total.toFixed(2)}`,
    '',
    'Please review the order in the admin dashboard.'
  ]
    .filter(Boolean)
    .join('\n');
}

export async function sendOrderWhatsappNotification(payload: OrderNotificationPayload) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let toPhone =
    process.env.WHATSAPP_TO_NUMBER?.replace(/[^0-9]/g, '') ?? DEFAULT_WHATSAPP_NUMBER;

  if (!accessToken || !phoneNumberId) {
    console.warn(
      '[WhatsApp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID. Notification skipped.'
    );
    return { success: false, error: 'Missing configuration' };
  }

  // Ensure phone number is in international format (country code + number)
  // If it doesn't start with country code, assume Nepal (+977) and add it
  if (!toPhone.startsWith('977')) {
    // Remove leading 0 if present (Nepal local format)
    toPhone = toPhone.replace(/^0+/, '');
    // Add country code if not present
    if (!toPhone.startsWith('977')) {
      toPhone = `977${toPhone}`;
    }
  }

  try {
    const message = buildMessage(payload);
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'text',
          text: {
            body: message
          }
        })
      }
    );

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: await response.text() };
      }
      console.error('[WhatsApp] Failed to send order notification:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return { success: false, error: errorData };
    }

    const result = await response.json();
    console.log('[WhatsApp] Order notification sent successfully:', {
      messageId: result.messages?.[0]?.id,
      to: toPhone
    });
    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (error) {
    console.error('[WhatsApp] Error sending order notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}


