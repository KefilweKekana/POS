import frappe
from frappe import _
from frappe.utils import flt, now, today, cint, get_datetime
import json

@frappe.whitelist()
def get_pos_data(pos_profile=None):
    """
    Get all data needed for POS screen.
    Returns items, customers, payment methods, settings.
    """
    if not pos_profile:
        # Get default POS Profile
        pos_profile = frappe.db.get_value("POS Profile", 
            {"disabled": 0}, "name", order_by="creation desc")
    
    if not pos_profile:
        frappe.throw(_("No POS Profile found. Please create one first."))
    
    profile = frappe.get_doc("POS Profile", pos_profile)
    
    data = {
        "pos_profile": profile.as_dict(),
        "items": get_pos_items(pos_profile),
        "customers": get_recent_customers(limit=50),
        "payment_methods": get_payment_methods(profile),
        "item_groups": get_item_groups(),
        "company": profile.company,
        "warehouse": profile.warehouse,
        "currency": frappe.defaults.get_global_default("currency")
    }
    
    return data


def get_pos_items(pos_profile):
    """Get items enabled for POS."""
    
    # Get POS profile settings
    profile = frappe.get_doc("POS Profile", pos_profile)
    
    # Build filters
    conditions = ["i.disabled = 0", "i.is_sales_item = 1"]
    values = []
    
    # Filter by item groups from POS Profile
    if profile.item_groups:
        item_groups = [d.item_group for d in profile.item_groups]
        placeholders = ", ".join(["%s"] * len(item_groups))
        conditions.append(f"i.item_group IN ({placeholders})")
        values.extend(item_groups)
    
    where_clause = " AND ".join(conditions)
    
    items = frappe.db.sql(f"""
        SELECT 
            i.name as item_code,
            i.item_name,
            i.item_group,
            i.stock_uom,
            i.image,
            i.description,
            i.has_batch_no,
            i.has_serial_no,
            COALESCE(i.custom_pos_category, i.item_group) as pos_category,
            COALESCE(i.custom_pos_sort_order, 0) as sort_order,
            ip.price_list_rate as rate,
            b.actual_qty
        FROM `tabItem` i
        LEFT JOIN `tabItem Price` ip ON i.name = ip.item_code 
            AND ip.price_list = %s
            AND ip.selling = 1
        LEFT JOIN `tabBin` b ON i.name = b.item_code 
            AND b.warehouse = %s
        WHERE {where_clause}
        ORDER BY sort_order, i.item_name
        LIMIT 500
    """, tuple([profile.selling_price_list, profile.warehouse] + values), as_dict=True)
    
    return items


@frappe.whitelist()
def get_recent_customers(limit=50):
    """Get recently used customers."""
    
    customers = frappe.db.sql("""
        SELECT DISTINCT 
            c.name as customer_code,
            c.customer_name,
            c.mobile_no,
            c.email_id,
            MAX(si.posting_date) as last_purchase
        FROM `tabCustomer` c
        LEFT JOIN `tabSales Invoice` si ON c.name = si.customer
        WHERE c.disabled = 0
        GROUP BY c.name
        ORDER BY last_purchase DESC NULLS LAST, c.creation DESC
        LIMIT %s
    """, limit, as_dict=True)
    
    return customers


def get_payment_methods(profile):
    """Get payment methods from POS Profile."""
    
    methods = []
    for pm in profile.payments:
        methods.append({
            "mode_of_payment": pm.mode_of_payment,
            "default": pm.default,
            "type": frappe.db.get_value("Mode of Payment", pm.mode_of_payment, "type")
        })
    
    return methods


def get_item_groups():
    """Get all item groups for filtering."""
    
    groups = frappe.get_all("Item Group",
        filters={"is_group": 0},
        fields=["name", "parent_item_group"],
        order_by="name")
    
    return groups


@frappe.whitelist()
def search_items(query, pos_profile):
    """Search items by name, code, or barcode."""
    
    if not query:
        return []
    
    profile = frappe.get_doc("POS Profile", pos_profile)
    
    # Try barcode first
    barcode_item = frappe.db.get_value("Item Barcode", {"barcode": query}, "parent")
    if barcode_item:
        return get_item_details(barcode_item, pos_profile)
    
    # Search by name or code
    items = frappe.db.sql("""
        SELECT 
            i.name as item_code,
            i.item_name,
            i.item_group,
            i.stock_uom,
            i.image,
            ip.price_list_rate as rate,
            b.actual_qty
        FROM `tabItem` i
        LEFT JOIN `tabItem Price` ip ON i.name = ip.item_code 
            AND ip.price_list = %s
        LEFT JOIN `tabBin` b ON i.name = b.item_code 
            AND b.warehouse = %s
        WHERE i.disabled = 0
        AND i.is_sales_item = 1
        AND (i.name LIKE %s OR i.item_name LIKE %s)
        LIMIT 20
    """, (profile.selling_price_list, profile.warehouse, f"%{query}%", f"%{query}%"), as_dict=True)
    
    return items


@frappe.whitelist()
def get_item_details(item_code, pos_profile):
    """Get detailed information about an item."""
    
    profile = frappe.get_doc("POS Profile", pos_profile)
    
    item = frappe.db.sql("""
        SELECT 
            i.name as item_code,
            i.item_name,
            i.item_group,
            i.stock_uom,
            i.image,
            i.description,
            i.has_batch_no,
            i.has_serial_no,
            ip.price_list_rate as rate,
            b.actual_qty,
            i.item_tax_template
        FROM `tabItem` i
        LEFT JOIN `tabItem Price` ip ON i.name = ip.item_code 
            AND ip.price_list = %s
        LEFT JOIN `tabBin` b ON i.name = b.item_code 
            AND b.warehouse = %s
        WHERE i.name = %s
    """, (profile.selling_price_list, profile.warehouse, item_code), as_dict=True)
    
    if item:
        # Get barcodes
        item[0]['barcodes'] = frappe.db.sql_list("""
            SELECT barcode 
            FROM `tabItem Barcode` 
            WHERE parent = %s
        """, item_code)
        
        return item[0]
    
    return None


@frappe.whitelist()
def create_sales_invoice(data):
    """
    Create and submit sales invoice from POS.
    
    Args:
        data: Dictionary with invoice data including items, customer, payments
    """
    if isinstance(data, str):
        data = json.loads(data)
    
    # Create Sales Invoice
    si = frappe.new_doc("Sales Invoice")
    
    # Basic details
    si.customer = data.get("customer")
    si.posting_date = today()
    si.posting_time = now()
    si.set_posting_time = 1
    si.is_pos = 1
    si.pos_profile = data.get("pos_profile")
    si.company = data.get("company")
    si.update_stock = 1  # Update stock on submit
    
    # Get POS Profile
    profile = frappe.get_doc("POS Profile", data.get("pos_profile"))
    si.selling_price_list = profile.selling_price_list
    si.set_warehouse = profile.warehouse
    si.cash_bank_account = profile.cash_bank_account if hasattr(profile, 'cash_bank_account') else None
    
    # Add items
    for item_data in data.get("items", []):
        si.append("items", {
            "item_code": item_data.get("item_code"),
            "qty": flt(item_data.get("qty")),
            "rate": flt(item_data.get("rate")),
            "warehouse": profile.warehouse,
            "discount_percentage": flt(item_data.get("discount_percentage", 0))
        })
    
    # Add payments
    for payment_data in data.get("payments", []):
        si.append("payments", {
            "mode_of_payment": payment_data.get("mode_of_payment"),
            "amount": flt(payment_data.get("amount"))
        })
    
    # Discount
    if data.get("discount_amount"):
        si.discount_amount = flt(data.get("discount_amount"))
    if data.get("additional_discount_percentage"):
        si.additional_discount_percentage = flt(data.get("additional_discount_percentage"))
    
    # Customer details for receipt
    if data.get("customer_mobile"):
        si.custom_customer_mobile = data.get("customer_mobile")
    if data.get("customer_email"):
        si.custom_customer_email = data.get("customer_email")
    
    # Calculate totals
    si.run_method("calculate_taxes_and_totals")
    
    # Insert and submit
    si.insert(ignore_permissions=True)
    si.submit()
    
    return {
        "success": True,
        "invoice_name": si.name,
        "invoice": si.as_dict(),
        "message": _("Sales Invoice {0} created successfully").format(si.name)
    }


@frappe.whitelist()
def get_invoice_for_print(invoice_name):
    """Get sales invoice data formatted for printing."""
    
    si = frappe.get_doc("Sales Invoice", invoice_name)
    
    # Get company details
    company = frappe.get_doc("Company", si.company)
    
    data = {
        "invoice": si.as_dict(),
        "company": {
            "name": company.company_name,
            "address": company.company_address if hasattr(company, 'company_address') else "",
            "phone": company.phone_no if hasattr(company, 'phone_no') else "",
            "email": company.email if hasattr(company, 'email') else "",
            "website": company.website if hasattr(company, 'website') else ""
        },
        "items": [],
        "payments": []
    }
    
    # Format items
    for item in si.items:
        data["items"].append({
            "item_code": item.item_code,
            "item_name": item.item_name,
            "qty": item.qty,
            "rate": item.rate,
            "amount": item.amount,
            "uom": item.uom
        })
    
    # Format payments
    for payment in si.payments:
        data["payments"].append({
            "mode_of_payment": payment.mode_of_payment,
            "amount": payment.amount
        })
    
    return data


@frappe.whitelist()
def get_customer_details(customer):
    """Get customer details for POS."""
    
    cust = frappe.get_doc("Customer", customer)
    
    return {
        "customer_code": cust.name,
        "customer_name": cust.customer_name,
        "mobile_no": cust.mobile_no,
        "email_id": cust.email_id,
        "customer_group": cust.customer_group,
        "territory": cust.territory
    }


@frappe.whitelist()
def quick_create_customer(customer_name, mobile_no=None, email_id=None):
    """Quickly create a customer from POS."""
    
    # Check if customer with same name exists
    if frappe.db.exists("Customer", customer_name):
        frappe.throw(_("Customer {0} already exists").format(customer_name))
    
    # Create customer
    cust = frappe.new_doc("Customer")
    cust.customer_name = customer_name
    cust.customer_type = "Individual"
    cust.customer_group = frappe.defaults.get_global_default("customer_group") or "Individual"
    cust.territory = frappe.defaults.get_global_default("territory") or "All Territories"
    
    if mobile_no:
        cust.mobile_no = mobile_no
    if email_id:
        cust.email_id = email_id
    
    cust.insert(ignore_permissions=True)
    
    return {
        "success": True,
        "customer": cust.as_dict(),
        "message": _("Customer {0} created").format(customer_name)
    }


@frappe.whitelist()
def hold_invoice(data):
    """Save invoice as draft for later."""
    if isinstance(data, str):
        data = json.loads(data)
    
    # Save to cache/session
    held_invoices = frappe.cache().get_value("pos_held_invoices") or {}
    invoice_id = f"HOLD-{now()}"
    held_invoices[invoice_id] = data
    
    frappe.cache().set_value("pos_held_invoices", held_invoices)
    
    return {
        "success": True,
        "invoice_id": invoice_id,
        "message": _("Invoice held successfully")
    }


@frappe.whitelist()
def get_held_invoices():
    """Get all held/parked invoices."""
    held_invoices = frappe.cache().get_value("pos_held_invoices") or {}
    return held_invoices


@frappe.whitelist()
def delete_held_invoice(invoice_id):
    """Delete a held invoice."""
    held_invoices = frappe.cache().get_value("pos_held_invoices") or {}
    if invoice_id in held_invoices:
        del held_invoices[invoice_id]
        frappe.cache().set_value("pos_held_invoices", held_invoices)
    
    return {"success": True}


def on_sales_invoice_submit(doc, method):
    """Hook called when sales invoice is submitted."""
    # Can trigger notifications, integrations, etc.
    pass


@frappe.whitelist()
def get_pos_profiles():
    """Get list of available POS Profiles."""
    profiles = frappe.get_all("POS Profile",
        filters={"disabled": 0},
        fields=["name", "company", "warehouse"],
        order_by="name")
    
    return profiles


@frappe.whitelist()
def get_sales_summary(pos_profile, from_date=None, to_date=None):
    """Get sales summary for the day/period."""
    
    if not from_date:
        from_date = today()
    if not to_date:
        to_date = today()
    
    summary = frappe.db.sql("""
        SELECT 
            COUNT(*) as total_invoices,
            SUM(grand_total) as total_sales,
            SUM(paid_amount) as total_paid,
            SUM(outstanding_amount) as total_outstanding,
            AVG(grand_total) as average_sale
        FROM `tabSales Invoice`
        WHERE is_pos = 1
        AND pos_profile = %s
        AND posting_date BETWEEN %s AND %s
        AND docstatus = 1
    """, (pos_profile, from_date, to_date), as_dict=True)
    
    # Get payment method breakdown
    payments = frappe.db.sql("""
        SELECT 
            sip.mode_of_payment,
            SUM(sip.amount) as total_amount,
            COUNT(DISTINCT sip.parent) as invoice_count
        FROM `tabSales Invoice Payment` sip
        INNER JOIN `tabSales Invoice` si ON sip.parent = si.name
        WHERE si.is_pos = 1
        AND si.pos_profile = %s
        AND si.posting_date BETWEEN %s AND %s
        AND si.docstatus = 1
        GROUP BY sip.mode_of_payment
    """, (pos_profile, from_date, to_date), as_dict=True)
    
    return {
        "summary": summary[0] if summary else {},
        "payments": payments
    }
