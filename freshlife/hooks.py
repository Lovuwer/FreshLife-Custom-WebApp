from freshlife import __version__ as app_version  # noqa: E402

app_name = "freshlife"
app_title = "FreshLife"
app_publisher = "FreshLife"
app_description = "FreshLife Omnichannel Supermarket Custom App for ERPNext"
app_email = ""
app_license = "MIT"

# Required apps
# required_apps = []

# Includes in <head>
# include_js = {"page": "public/js/file.js"}
# include_css = {"page": "public/css/file.css"}

# Fixtures — export Custom Fields so they can be imported on a fresh site
fixtures = [
    {
        "dt": "Custom Field",
        "filters": [
            [
                "dt",
                "in",
                ["Item", "Website Item", "Customer", "Address", "Sales Order"],
            ]
        ],
    },
]

# Scheduled tasks
scheduler_events = {
    "daily": [
        "freshlife.tasks.daily",
    ],
    "hourly": [
        "freshlife.tasks.hourly",
    ],
}

# DocType JS overrides
# override_doctype_js = {"Sales Order": "public/js/sales_order.js"}

# Document lifecycle hooks
# doc_events = {
#     "Sales Order": {
#         "on_submit": "freshlife.events.sales_order.on_submit",
#         "on_cancel": "freshlife.events.sales_order.on_cancel",
#     }
# }
