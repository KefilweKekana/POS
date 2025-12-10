from . import __version__ as app_version

app_name = "modern_pos"
app_title = "Modern POS"
app_publisher = "Your Company"
app_description = "Modern, touch-friendly Point of Sale system with barcode scanning, quick checkout, and receipt printing"
app_email = "your-email@example.com"
app_license = "MIT"

# Desk Pages - POS Interface
desk_pages = ["pos-screen"]

# Document events
doc_events = {
    "Sales Invoice": {
        "on_submit": "modern_pos.api.on_sales_invoice_submit",
    }
}

# Custom fields to be added
after_install = "modern_pos.install.after_install"

# Fixtures - will be exported/imported
fixtures = [
    {
        "doctype": "Custom Field",
        "filters": [
            [
                "name", "in", [
                    "Item-custom_pos_enabled",
                    "Item-custom_pos_category",
                    "Item-custom_pos_sort_order"
                ]
            ]
        ]
    }
]
