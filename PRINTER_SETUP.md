# Thermal Printer Setup Guide

This guide will help you set up the CP-Q1UN thermal printer with your restaurant website.

## Printer Information

- **Model**: CP-Q1UN
- **Interfaces**: USB + LAN (Ethernet)
- **Features**: Auto-cutter
- **Connection**: Network (IP-based) or USB

## Setup Options

### Option 1: Network Printing (Recommended)

This is the easiest method for web-based printing.

#### Step 1: Connect Printer to Network

1. Connect the printer to your router/network using the Ethernet cable
2. Power on the printer
3. The printer will get an IP address from your router (via DHCP)

#### Step 2: Find Printer IP Address

**Method A: Check Router Admin Panel**
1. Log into your router's admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Look for connected devices
3. Find the printer (may show as "CP-Q1UN" or similar)
4. Note the IP address (e.g., `192.168.1.100`)

**Method B: Print Network Configuration**
1. Most thermal printers have a button to print network settings
2. Press and hold the printer button for a few seconds
3. It will print a page with IP address, subnet mask, etc.

**Method C: Use Network Scanner**
- Use a network scanning tool like `nmap` or `Advanced IP Scanner`
- Scan your local network to find the printer

#### Step 3: Configure Environment Variables

Add these to your `.env.local` file in the `restaurant-web` directory:

```env
# Thermal Printer Configuration
PRINTER_IP=192.168.1.100
PRINTER_PORT=9100
```

Replace `192.168.1.100` with your printer's actual IP address.

**Default Port**: Most thermal printers use port `9100` (RAW printing port). If your printer uses a different port, update `PRINTER_PORT`.

#### Step 4: Test Connection

1. Restart your Next.js server:
   ```bash
   npm run dev
   ```

2. Place a test order
3. Check the server console for:
   - `[PrintService] Receipt printed successfully` ✅
   - OR error messages if connection failed

### Option 2: USB Printing (Advanced)

USB printing requires the server to be on the same machine as the printer.

#### Step 1: Install USB Drivers

1. Install the printer drivers on your server machine
2. Ensure the printer is recognized by the OS

#### Step 2: Configure USB Port

You'll need to modify `lib/printService.ts` to use USB instead of network. This requires additional setup with USB libraries.

**Note**: USB printing from web applications is more complex and may require:
- Running a print server/daemon
- Using CUPS (Linux/Mac) or Windows Print Spooler
- Additional Node.js libraries

**Recommendation**: Use network printing (Option 1) for easier setup.

## Receipt Format

The receipt includes:
- Restaurant name and header
- Order ID and date
- Customer information
- Itemized list with quantities and prices
- Total amount
- Delivery address (if provided)
- Thank you message

## Troubleshooting

### "PRINTER_IP not configured"
- Make sure `.env.local` exists in `restaurant-web/` directory
- Verify `PRINTER_IP` is set correctly
- Restart the server after adding variables

### "Connection timeout" or "Connection refused"
- **Check printer is powered on** and connected to network
- **Verify IP address** is correct (ping the IP: `ping 192.168.1.100`)
- **Check port** - try port `9100` (default for RAW printing)
- **Firewall** - ensure port 9100 is not blocked
- **Network** - ensure server and printer are on the same network

### "Failed to print" but no specific error
- Check printer has paper
- Check printer is not in error state (check LED indicators)
- Try printing a test page from printer settings

### Receipt prints but format is wrong
- The printer uses ESC/POS commands
- If text alignment is off, the printer may need different commands
- Check printer manual for ESC/POS compatibility

### Printer not found on network
- Ensure printer is connected via Ethernet cable
- Check router assigns IP via DHCP
- Try setting a static IP on the printer (check printer manual)
- Restart printer and router

## Testing Print Function

You can test printing manually by creating a test API call:

```bash
curl -X POST http://localhost:3000/api/admin/print/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "total": 500.00,
    "createdAt": "2024-01-01T12:00:00Z",
    "customerName": "Test Customer",
    "phone": "9864320552",
    "address": "Test Address",
    "items": [
      {"menuItem": {"title": "Test Item"}, "qty": 2, "price": 250.00}
    ]
  }'
```

## Security Notes

- Keep printer on a private/local network
- Don't expose printer port to the internet
- Use firewall rules to restrict access
- Consider using a VPN if accessing remotely

## Additional Resources

- [ESC/POS Command Reference](https://reference.epson-biz.com/modules/ref_escpos/)
- Printer Manual: Check manufacturer's website for CP-Q1UN documentation

