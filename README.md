# Modern POS - Touch-Friendly Point of Sale

A beautiful, fast, and intuitive Point of Sale system for ERPNext with modern UI, barcode scanning, and lightning-fast checkout.

## 🎯 What This App Does

Modern POS transforms your sales process into a streamlined, touch-friendly experience:

- **🎨 Beautiful Interface** - Modern, clean design with intuitive layout
- **⚡ Lightning Fast** - Complete sales in seconds, not minutes
- **📱 Touch-Friendly** - Optimized for tablets and touch screens
- **🔍 Barcode Scanning** - Instant product lookup with any scanner
- **💰 Multiple Payment Methods** - Cash, card, UPI, and more
- **🧾 Quick Receipt Printing** - One-click print or email
- **👥 Customer Management** - Quick customer selection and creation
- **📊 Real-time Updates** - Live stock and pricing
- **⌨️ Keyboard Shortcuts** - Lightning fast for power users

## ✨ Key Features

### 1. Modern Product Grid

**Visual product display:**
- Product images with stock levels
- Color-coded stock indicators (green = in stock, red = out)
- Price display with currency
- Category filtering
- Real-time search
- Smooth animations

### 2. Smart Cart Management

**Intuitive shopping cart:**
- Add items with one click/tap
- Adjust quantities with +/- buttons
- Remove items easily
- See running total in real-time
- Apply discounts per item or invoice
- Visual feedback for all actions

### 3. Fast Checkout Process

**Complete sales in seconds:**
1. Select/scan items → 2 seconds
2. Choose payment method → 2 seconds  
3. Complete → 1 second
**Total: ~5 seconds!** ⚡

### 4. Barcode Scanning

**Multiple scanning methods:**
- USB barcode scanners (plug & play)
- Bluetooth scanners
- Manual entry fallback
- Instant item lookup
- Auto-add to cart

### 5. Payment Processing

**Flexible payment options:**
- Multiple payment methods
- Split payments (coming soon)
- Cash change calculation
- Digital payment integration (coming soon)
- Receipt generation

### 6. Customer Management

**Quick customer handling:**
- Fast customer search
- Walk-in customer option
- Create new customers on-the-fly
- Customer history view (coming soon)
- Loyalty points (coming soon)

## 📦 Installation

### Prerequisites
- ERPNext v14 or v15
- At least one POS Profile configured
- Items with prices in price list

### Install Steps

```bash
# 1. Copy to apps directory
cp -r modern_pos ~/frappe-bench/apps/

# 2. Install on your site
cd ~/frappe-bench
bench --site your-site install-app modern_pos
bench --site your-site clear-cache
bench restart
```

## 🚀 Quick Start

### Setup (One Time)

**Step 1: Configure POS Profile**
1. Go to **Selling → POS Profile**
2. Create or edit a POS Profile
3. Set:
   - Company
   - Warehouse
   - Price List
   - Payment Methods
   - Applicable Item Groups

**Step 2: Enable Items for POS**
1. Go to any **Item** form
2. Find **"POS Settings"** section
3. Check ☑️ **"Show in POS"**
4. Optionally set:
   - POS Category
   - Sort Order

### First Sale (2 Minutes)

**Step 1: Open POS**
1. Search for **"POS Screen"**
2. Or go to `/app/pos-screen`
3. Products load automatically!

**Step 2: Add Items**
- **Click** product cards to add
- **Or scan** barcodes
- **Or search** by name/code

**Step 3: Checkout**
1. Review cart
2. Select customer (optional)
3. Click **"Pay"** button
4. Choose payment method
5. Click **"Complete Sale"**
6. Done! 🎉

## 🎨 Interface Overview

```
┌─────────────────────────────────────────────────────┐
│  POS SCREEN                   [Hold] [Settings] [×] │
├─────────────────────┬───────────────────────────────┤
│                     │  CUSTOMER: [Walk-in] [+]     │
│  [Search box...]    ├───────────────────────────────┤
│                     │                               │
│  [All] [Food]       │  CART                         │
│  [Beverages] [...]  │  • Widget A  x2  ₹200         │
│                     │  • Part B    x1  ₹150         │
│  ┌──────┐ ┌──────┐  │  • Tool C    x3  ₹450         │
│  │Widget│ │Part B│  │                               │
│  │  A   │ │      │  ├───────────────────────────────┤
│  │₹100  │ │₹150  │  │  Subtotal:         ₹800       │
│  └──────┘ └──────┘  │  Discount:         -₹50       │
│  ┌──────┐ ┌──────┐  │  Tax:              ₹75        │
│  │Tool C│ │Item D│  │  ─────────────────────        │
│  │₹150  │ │₹200  │  │  TOTAL:            ₹825       │
│  └──────┘ └──────┘  ├───────────────────────────────┤
│  ...more items...   │  [Discount]      [💰 PAY]     │
└─────────────────────┴───────────────────────────────┘
```

### Left Panel: Products
- **Search bar** - Find items instantly
- **Category filters** - Quick category switching
- **Product grid** - Visual product cards with:
  - Product image
  - Stock level indicator
  - Item name and code
  - Price
  - Quick add button

### Right Panel: Cart & Checkout
- **Customer selection** - Choose or create customer
- **Cart items** - List of items being purchased with:
  - Quantity adjustments (+/-)
  - Remove button
  - Individual totals
- **Totals section** - Subtotal, discount, tax, grand total
- **Action buttons** - Discount and Pay

## ⚡ Features in Detail

### Product Grid

**Smart product display:**
- Responsive grid (adapts to screen size)
- High-quality images
- Stock indicators:
  - 🟢 Green = In stock (shows quantity)
  - 🔴 Red = Out of stock
- Hover effects for better UX
- Fast loading with image optimization

### Cart Management

**Intuitive cart operations:**
- **Add to cart** - Click product or scan barcode
- **Increase qty** - Click + button or type quantity
- **Decrease qty** - Click - button
- **Remove item** - Click trash icon
- **Edit quantity** - Type directly in quantity field
- **Real-time calculations** - Totals update instantly

### Search & Filter

**Find products fast:**
- **Search** - Type item name or code
- **Categories** - Click category buttons to filter
- **Scan barcode** - Instant item lookup
- **Clear filters** - Return to all products view

### Payment

**Flexible payment processing:**
- **Select method** - Choose from configured payment methods
- **Enter amount** - Default is total, can be adjusted
- **Change calculation** - Automatic change display
  - Green background = Correct change
  - Red background = Short payment
- **Complete** - Creates and submits sales invoice
- **Print option** - Prompt to print receipt

### Customer Handling

**Quick customer management:**
- **Walk-in** - Default for anonymous customers
- **Select existing** - Dropdown with recent customers
- **Create new** - One-click customer creation dialog
  - Name (required)
  - Mobile number
  - Email
- **Customer details** - Saved with invoice for future reference

### Discount Application

**Flexible discounting:**
- **Percentage discount** - Apply % discount to total
- **Amount discount** - Apply fixed amount discount
- **Item-level** - Distribute discount across items
- **Real-time update** - See discount effect immediately

### Barcode Scanning

**Multiple scanning modes:**

**Mode 1: Physical Scanner (Recommended)**
- Plug in USB/Bluetooth scanner
- Scanner in keyboard emulation mode
- Scan barcode
- Item instantly added to cart

**Mode 2: Manual Entry**
- Type barcode/item code in search
- Press Enter
- Item found and added

**Mode 3: Click to Add**
- Browse products visually
- Click product card
- Added to cart

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F2` | Focus search box |
| `F8` | Apply discount |
| `F9` | Open payment dialog |
| `Esc` | Clear search |
| `Enter` | (in search) Add scanned item |

## 🔧 Configuration

### POS Profile Setup

**Essential settings in POS Profile:**

```
Company: Your Company Name
Warehouse: Your Main Warehouse
Price List: Standard Selling
Currency: INR (or your currency)

Payment Methods:
- Cash (Default)
- Card
- UPI
- Others...

Item Groups:
- Add item groups to show in POS
- Leave empty for all items
```

### Item Configuration

**Per item settings (optional):**

```
Show in POS: ✓ (checked by default)
POS Category: Custom category name
POS Sort Order: 0 (lower = appears first)
```

### Custom Fields Added

The app adds these custom fields:

**On Item:**
- `custom_pos_enabled` - Show in POS (checkbox)
- `custom_pos_category` - POS Category (text)
- `custom_pos_sort_order` - Display order (number)

**On Sales Invoice:**
- `custom_customer_mobile` - Customer mobile
- `custom_customer_email` - Customer email

## 🎯 Use Cases

### Retail Store

**Morning Routine:**
1. Open POS Screen
2. Start making sales
3. Scan items or click products
4. Fast checkout
5. Print receipts

**Features Used:**
- Product grid
- Barcode scanning
- Quick checkout
- Receipt printing

### Restaurant / Cafe

**Order Taking:**
1. Open POS
2. Select items from categories
  (Food, Beverages, Desserts)
3. Adjust quantities
4. Choose payment method
5. Complete order

**Features Used:**
- Category filtering
- Touch-friendly interface
- Quick item selection
- Multiple payment methods

### Small Business

**Counter Sales:**
1. Customer requests items
2. Search or scan items
3. Add to cart
4. Apply discount if applicable
5. Process payment
6. Print receipt

**Features Used:**
- Search functionality
- Discount application
- Customer management
- Fast checkout

## 📊 Reports & Analytics

Access standard ERPNext reports:
- Sales Register
- Item-wise Sales Register
- POS Closing Voucher
- Daily Sales Summary

## 🎨 Customization

### Changing Colors

Edit `/modern_pos/page/pos_screen/pos_screen.js`:

```javascript
// Product card hover color
'box-shadow': '0 4px 12px rgba(33,150,243,0.3)' // Change RGB values

// Stock indicator colors
const stock_color = item.actual_qty > 0 ? '#4caf50' : '#f44336';
// Change to your brand colors
```

### Adding Payment Methods

1. Go to **Accounting → Mode of Payment**
2. Create new payment method
3. Add to POS Profile
4. Appears automatically in POS

### Category Display

Categories are automatically created from:
1. Item's `custom_pos_category` field
2. Or Item's `item_group` field

To create custom categories:
1. Edit items
2. Set **POS Category** field
3. Save
4. Reload POS

## 🚨 Troubleshooting

### POS not loading?

**Check:**
1. POS Profile exists and is active
2. Items have prices in the price list
3. Items are marked as "is_sales_item"
4. Clear cache: `bench --site your-site clear-cache`

### Barcode scanner not working?

**Solutions:**
1. Check scanner is in keyboard mode
2. Test scanner in notepad first
3. Ensure cursor is not in a text field
4. Try manual entry as fallback

### Items not appearing?

**Check:**
1. Item has "Show in POS" checked
2. Item is in selected item groups (POS Profile)
3. Item has price in the selected price list
4. Item is enabled (not disabled)

### Payment failing?

**Check:**
1. Payment method configured in POS Profile
2. Cash/Bank account set in payment method
3. Warehouse has stock (if update_stock = 1)
4. Company settings are correct

### Receipt not printing?

**Solutions:**
1. Check browser print settings
2. Try "Print" button on sales invoice
3. Configure receipt format in Print Format
4. Check printer connection

## 💡 Best Practices

### Daily Operations

**Opening:**
1. Open POS Screen
2. Verify stock levels
3. Test barcode scanner
4. Check printer

**During Sales:**
1. Scan items when possible
2. Verify quantities
3. Apply discounts appropriately
4. Print receipts for customers

**Closing:**
1. Review POS Closing report
2. Match cash in drawer
3. Create POS Closing Voucher
4. Review any held invoices

### Performance Tips

**For smooth operation:**
1. **Limit items** - Show only relevant items in POS
2. **Optimize images** - Use compressed product images
3. **Regular cleanup** - Archive old data
4. **Good hardware** - Use decent tablet/computer
5. **Fast internet** - For cloud-hosted ERPNext

### Security

**Protect your POS:**
1. **User permissions** - Give POS access only to sales staff
2. **POS Profile** - Use separate profiles per terminal
3. **Password protect** - Lock computer when away
4. **Regular backups** - Backup your data
5. **Monitor** - Check POS transactions regularly

## 🎁 Advanced Features (Coming Soon)

**In development:**
- ⏳ Offline mode - Work without internet
- 💳 Card payment integration - Direct payment processing
- 🎫 Loyalty program - Points and rewards
- 📧 Email receipts - Send receipts via email
- 📱 Mobile app - Native Android/iOS app
- 🔔 Low stock alerts - Get notified in POS
- 📦 Multiple warehouses - Switch warehouse in POS
- 👤 Customer display - Show total to customer
- 🎨 Custom themes - Brand colors and logo
- 📊 Advanced analytics - Sales dashboard

## 📚 Integration

**Works with:**
- ERPNext Stock module - Auto stock updates
- ERPNext Accounts - Auto accounting entries
- ERPNext CRM - Customer data sync
- Standard ERPNext reports - All reports work

**Extends:**
- Sales Invoice - Creates standard invoices
- Item - Uses standard items
- Customer - Uses standard customers
- Payment Entry - Standard payment processing

## 🤝 Support

**Need help?**
- Check README.md
- Review POS Profile settings
- Test with simple scenario first
- Contact: your-email@example.com

## 📝 License

MIT

---

## 🎉 Benefits Summary

**Before Modern POS:**
- Complex sales invoice form
- Multiple steps for one sale
- Not touch-friendly
- Slow barcode lookup
- Poor visual feedback

**After Modern POS:**
- One-screen interface ✨
- 5-second checkout ⚡
- Touch-optimized 📱
- Instant barcode scanning 🔍
- Beautiful, modern UI 🎨
- Real-time updates ⚡
- Happy customers 😊
- Happy staff 👍

**Make your sales process 10x faster with Modern POS!** 🚀
