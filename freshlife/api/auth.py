"""
FreshLife Auth API
Endpoints: send_otp, verify_otp, refresh_session
"""

import hashlib
import secrets

import frappe
from frappe import _

# OTP settings
OTP_LENGTH = 6
OTP_TTL_SECONDS = 300  # 5 minutes
OTP_RATE_LIMIT = 3  # max OTP requests per window
OTP_RATE_WINDOW = 600  # 10 minutes in seconds
OTP_MAX_ATTEMPTS = 5


def _generate_otp() -> str:
    """Generate a cryptographically secure random 6-digit OTP."""
    return "".join(secrets.choice("0123456789") for _ in range(OTP_LENGTH))


def _hash_otp(otp: str, phone: str) -> str:
    return hashlib.sha256(f"{phone}:{otp}".encode()).hexdigest()


def _rate_limit_key(phone: str) -> str:
    return f"otp_rate:{phone}"


def _otp_cache_key(phone: str) -> str:
    return f"otp:{phone}"


@frappe.whitelist(allow_guest=True)
def send_otp(phone_number: str) -> dict:
    """
    Send OTP to phone number.
    - Rate limit: 3 requests per phone per 10 minutes
    - Generates 6-digit OTP
    - Stores hash in Redis cache with 5-min TTL
    - Sends SMS via configured gateway
    - Creates OTP Session audit log
    Returns: { "message": "OTP sent", "expires_in": 300 }
    """
    if not phone_number or len(phone_number) < 10:
        frappe.throw(_("Invalid phone number"), frappe.InvalidStatusError)

    # Rate limiting via Redis
    rate_key = _rate_limit_key(phone_number)
    count = frappe.cache().get(rate_key) or 0
    if int(count) >= OTP_RATE_LIMIT:
        frappe.throw(
            _("Too many OTP requests. Please try again after 10 minutes."),
            frappe.PermissionError,
        )

    otp = _generate_otp()
    otp_hash = _hash_otp(otp, phone_number)

    # Store in Redis
    frappe.cache().setex(_otp_cache_key(phone_number), OTP_TTL_SECONDS, otp_hash)

    # Increment rate counter
    pipe = frappe.cache().pipeline()
    pipe.incr(rate_key)
    pipe.expire(rate_key, OTP_RATE_WINDOW)
    pipe.execute()

    # Create audit log
    try:
        otp_session = frappe.new_doc("OTP Session")
        otp_session.phone_number = phone_number
        otp_session.otp_hash = otp_hash
        otp_session.expires_at = frappe.utils.add_to_date(
            frappe.utils.now_datetime(), seconds=OTP_TTL_SECONDS
        )
        otp_session.ip_address = frappe.local.request_ip if frappe.local.request_ip else ""
        otp_session.insert(ignore_permissions=True)
        frappe.db.commit()
    except Exception:
        pass  # Audit log is non-critical

    # Send SMS via utility
    try:
        from freshlife.utils.sms import send_sms
        send_sms(phone_number, f"Your FreshLife OTP is: {otp}. Valid for 5 minutes.")
    except Exception as e:
        frappe.log_error(str(e), "FreshLife OTP SMS Error")

    return {"message": "OTP sent", "expires_in": OTP_TTL_SECONDS}


@frappe.whitelist(allow_guest=True)
def verify_otp(phone_number: str, otp: str) -> dict:
    """
    Verify OTP and create/return user session.
    - Validates OTP against Redis cache
    - If Customer exists with phone → login
    - If no Customer → create Customer + User, then login
    Returns: {
        "token": "api_key:api_secret",
        "customer": { "name", "customer_name", "phone", "email" },
        "is_new_user": bool
    }
    """
    if not phone_number or not otp:
        frappe.throw(_("Phone number and OTP are required."), frappe.ValidationError)

    stored_hash = frappe.cache().get(_otp_cache_key(phone_number))
    if not stored_hash:
        frappe.throw(_("OTP expired or not found. Please request a new OTP."), frappe.ValidationError)

    if isinstance(stored_hash, bytes):
        stored_hash = stored_hash.decode()

    expected_hash = _hash_otp(otp.strip(), phone_number)
    if not frappe.safe_decode(stored_hash) == expected_hash:
        frappe.throw(_("Invalid OTP."), frappe.AuthenticationError)

    # Invalidate OTP
    frappe.cache().delete(_otp_cache_key(phone_number))

    # Find or create Customer
    is_new_user = False
    customer_name = frappe.db.get_value(
        "Customer", {"custom_phone_number": phone_number}, "name"
    )

    if not customer_name:
        is_new_user = True
        # Create a Frappe User
        email = f"fl_{phone_number}@freshlife.local"
        if not frappe.db.exists("User", email):
            user = frappe.new_doc("User")
            user.email = email
            user.first_name = phone_number
            user.phone = phone_number
            user.send_welcome_email = 0
            user.insert(ignore_permissions=True)
        else:
            user = frappe.get_doc("User", email)

        # Create linked Customer
        customer = frappe.new_doc("Customer")
        customer.customer_name = phone_number
        customer.customer_group = "Individual"
        customer.territory = "All Territories"
        customer.custom_phone_number = phone_number
        customer.insert(ignore_permissions=True)
        frappe.db.commit()
        customer_name = customer.name

    customer_doc = frappe.get_doc("Customer", customer_name)

    # Generate API keys for token-based auth
    email = f"fl_{phone_number}@freshlife.local"
    user_doc = frappe.get_doc("User", email) if frappe.db.exists("User", email) else None

    token = None
    if user_doc:
        if not user_doc.api_key:
            user_doc.api_key = frappe.generate_hash(length=15)
        if not user_doc.api_secret:
            api_secret = frappe.generate_hash(length=15)
            user_doc.api_secret = api_secret
        else:
            api_secret = user_doc.get_password("api_secret")
        user_doc.save(ignore_permissions=True)
        frappe.db.commit()
        token = f"{user_doc.api_key}:{api_secret}"

    return {
        "token": token,
        "customer": {
            "name": customer_doc.name,
            "customer_name": customer_doc.customer_name,
            "phone": customer_doc.custom_phone_number,
            "email": customer_doc.email_id or "",
        },
        "is_new_user": is_new_user,
    }


@frappe.whitelist()
def refresh_session() -> dict:
    """
    Validate current session and return fresh user data.
    Returns: { "customer": {...}, "cart_count": int }
    """
    if frappe.session.user == "Guest":
        frappe.throw(_("Authentication required."), frappe.AuthenticationError)

    email = frappe.session.user
    customer_name = frappe.db.get_value("Customer", {"email_id": email}, "name")

    if not customer_name:
        # Try matching by phone pattern used at registration
        phone = email.replace("fl_", "").replace("@freshlife.local", "")
        customer_name = frappe.db.get_value(
            "Customer", {"custom_phone_number": phone}, "name"
        )

    if not customer_name:
        frappe.throw(_("Customer record not found."), frappe.DoesNotExistError)

    customer_doc = frappe.get_doc("Customer", customer_name)

    cart_count = 0
    cart = frappe.db.get_value("Cart", {"customer": customer_name}, "name")
    if cart:
        cart_doc = frappe.get_doc("Cart", cart)
        cart_count = sum(row.quantity for row in cart_doc.items)

    return {
        "customer": {
            "name": customer_doc.name,
            "customer_name": customer_doc.customer_name,
            "phone": customer_doc.custom_phone_number,
            "email": customer_doc.email_id or "",
        },
        "cart_count": cart_count,
    }
