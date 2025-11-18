/**
 * Thermal Printer Service for CP-Q1UN Printer
 * Supports USB and LAN (Network) connections
 */

type OrderItem = {
  menuItem?: { title: string };
  qty: number;
  price: number;
};

type OrderData = {
  id: string;
  orderNumber?: string;
  total: number;
  createdAt: string;
  customerName?: string;
  customerEmail?: string | null;
  phone?: string;
  address?: string;
  items: OrderItem[];
};

/**
 * Format order data as ESC/POS receipt
 * ESC/POS is the standard command set for thermal printers
 * Simplified format with only essential information
 */
export function formatReceipt(order: OrderData, paperWidth: string = '80mm'): string {
  const ESC = '\x1B';
  const GS = '\x1D';
  const lines: string[] = [];

  // Initialize printer (no extra feeds - start immediately at top)
  lines.push(`${ESC}@`); // Reset printer
  
  // Set font to Font A (default thermal receipt font - monospace, blocky style)
  lines.push(`${ESC}M${String.fromCharCode(0)}`); // Font A (12x24, standard receipt font)

  // Center align and set font for header (Double size + Bold) - minimal top padding
  lines.push(`${ESC}a${String.fromCharCode(1)}`); // Center align
  lines.push(`${ESC}!${String.fromCharCode(17)}`); // Double height + width + Bold (16 + 1)

  // Header - "Online order" (BOLD, LARGE) - starts immediately at top
  lines.push('Online order');

  // Reset alignment and font (no blank line)
  lines.push(`${ESC}a${String.fromCharCode(0)}`); // Left align
  // Use larger normal size (height doubled but width normal) + Bold for consistency
  lines.push(`${ESC}!${String.fromCharCode(9)}`); // Double height + Bold (8 + 1) - larger but same style as order time

  // Order number (BOLD, larger size, same font style as order time)
  const displayOrderNumber = order.orderNumber ?? `#${order.id.slice(-8).toUpperCase()}`;
  lines.push(`order number: ${displayOrderNumber}`);

  // Customer name (BOLD, larger size, same font style as order time)
  const customerName = order.customerName || order.customerEmail || 'Guest';
  lines.push(`customer name: ${customerName}`);

  // Order time (BOLD, larger size to match others)
  const orderDate = new Date(order.createdAt);
  const timeStr = orderDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  });
  lines.push(`order time: ${timeStr}`);
  
  // Reset to normal font
  lines.push(`${ESC}!${String.fromCharCode(0)}`); // Normal font

  // No feed before cutting - cut immediately

  // Cut paper (if auto-cutter is enabled)
  lines.push(`${GS}V${String.fromCharCode(65)}${String.fromCharCode(0)}`); // Full cut

  return lines.join('\n');
}

/**
 * Send print job to network printer via IP address
 */
export async function printToNetworkPrinter(
  receipt: string,
  printerIP: string,
  printerPort: number = 9100
): Promise<{ success: boolean; error?: string }> {
  try {
    const net = await import('net');
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 5000; // 5 second timeout

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        socket.write(receipt, 'utf8', () => {
          socket.end();
          resolve({ success: true });
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });

      socket.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      socket.connect(printerPort, printerIP);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import net module'
    };
  }
}

/**
 * Main print function - tries network printer first, then falls back to other methods
 */
export async function printOrderReceipt(order: OrderData): Promise<{ success: boolean; error?: string }> {
  const printerIP = process.env.PRINTER_IP;
  const printerPort = parseInt(process.env.PRINTER_PORT || '9100', 10);
  const paperWidth = process.env.PRINTER_PAPER_WIDTH || '80mm'; // 58mm or 80mm

  if (!printerIP) {
    return {
      success: false,
      error: 'PRINTER_IP not configured in environment variables'
    };
  }

  const receipt = formatReceipt(order, paperWidth);

  // Try network printing
  const result = await printToNetworkPrinter(receipt, printerIP, printerPort);

  if (!result.success) {
    console.error('[PrintService] Failed to print:', result.error);
  } else {
    console.log('[PrintService] Receipt printed successfully');
  }

  return result;
}

