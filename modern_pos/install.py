import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

def after_install():
    """
    Run after app installation to set up custom fields and configurations.
    """
    print("Setting up Modern POS...")
    
    # Create custom fields
    create_pos_custom_fields()
    
    # Clear cache
    frappe.clear_cache()
    
    print("Modern POS setup completed successfully!")


def create_pos_custom_fields():
    """
    Create custom fields for POS functionality.
    """
    custom_fields = {
        "Item": [
            {
                "fieldname": "custom_pos_section",
                "label": "POS Settings",
                "fieldtype": "Section Break",
                "insert_after": "item_group",
                "collapsible": 1
            },
            {
                "fieldname": "custom_pos_enabled",
                "label": "Show in POS",
                "fieldtype": "Check",
                "insert_after": "custom_pos_section",
                "default": "1",
                "description": "Enable this item in POS screen"
            },
            {
                "fieldname": "custom_pos_category",
                "label": "POS Category",
                "fieldtype": "Data",
                "insert_after": "custom_pos_enabled",
                "description": "Category for POS display (defaults to Item Group)"
            },
            {
                "fieldname": "custom_pos_sort_order",
                "label": "POS Sort Order",
                "fieldtype": "Int",
                "insert_after": "custom_pos_category",
                "default": "0",
                "description": "Display order in POS (lower numbers first)"
            }
        ],
        "Sales Invoice": [
            {
                "fieldname": "custom_customer_mobile",
                "label": "Customer Mobile",
                "fieldtype": "Data",
                "insert_after": "customer_name",
                "read_only": 1
            },
            {
                "fieldname": "custom_customer_email",
                "label": "Customer Email",
                "fieldtype": "Data",
                "insert_after": "custom_customer_mobile",
                "read_only": 1
            }
        ]
    }
    
    create_custom_fields(custom_fields, update=True)
    print("Custom fields created successfully!")
