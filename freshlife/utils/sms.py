"""
FreshLife SMS Utility
Sends OTP and notification SMSes via a configurable gateway.

Configure in site_config.json:
  "sms_gateway": "msg91"  (or "twilio", "mock")
  "msg91_auth_key": "...",
  "msg91_template_id": "...",
  "twilio_account_sid": "...",
  "twilio_auth_token": "...",
  "twilio_from_number": "..."
"""

import frappe


def send_sms(phone_number: str, message: str) -> bool:
    """
    Send an SMS message to the given phone number.
    Returns True on success, False on failure.
    Falls back to logging if no gateway is configured.
    """
    gateway = frappe.conf.get("sms_gateway", "mock")

    if gateway == "msg91":
        return _send_msg91(phone_number, message)
    elif gateway == "twilio":
        return _send_twilio(phone_number, message)
    else:
        # Mock / development mode — log instead of sending
        frappe.log_error(f"[SMS MOCK] To: {phone_number} | Message: {message}", "FreshLife SMS Mock")
        return True


def _send_msg91(phone_number: str, message: str) -> bool:
    """Send SMS via MSG91."""
    try:
        import requests  # noqa: PLC0415

        auth_key = frappe.conf.get("msg91_auth_key", "")
        template_id = frappe.conf.get("msg91_template_id", "")
        if not auth_key:
            frappe.log_error("MSG91 auth key not configured.", "FreshLife SMS Error")
            return False

        payload = {
            "template_id": template_id,
            "short_url": "0",
            "mobiles": phone_number.lstrip("+"),
            "var1": message,
        }
        headers = {"authkey": auth_key, "Content-Type": "application/json"}
        response = requests.post(
            "https://api.msg91.com/api/v5/flow/",
            json=payload,
            headers=headers,
            timeout=10,
        )
        return response.status_code == 200
    except Exception as e:
        frappe.log_error(str(e), "FreshLife MSG91 Error")
        return False


def _send_twilio(phone_number: str, message: str) -> bool:
    """Send SMS via Twilio."""
    try:
        from twilio.rest import Client  # noqa: PLC0415

        account_sid = frappe.conf.get("twilio_account_sid", "")
        auth_token = frappe.conf.get("twilio_auth_token", "")
        from_number = frappe.conf.get("twilio_from_number", "")

        if not account_sid or not auth_token or not from_number:
            frappe.log_error("Twilio credentials not fully configured.", "FreshLife SMS Error")
            return False

        client = Client(account_sid, auth_token)
        client.messages.create(body=message, from_=from_number, to=phone_number)
        return True
    except Exception as e:
        frappe.log_error(str(e), "FreshLife Twilio Error")
        return False
