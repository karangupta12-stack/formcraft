import logging
import threading

from django.conf import settings
from django.core.mail import send_mail


logger = logging.getLogger(__name__)


def _send(subject, message, recipient):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
    except Exception:
        logger.exception('Failed to send response notification email.')


def send_response_notification(form, response):
    """Send email notification to form owner when a new response is received."""
    form_settings = form.settings
    if not form_settings.notify_on_submit or not form_settings.notify_email:
        return

    fields    = [f for f in (form.fields_json or []) if f.get('type') not in ('section', 'calculated')]
    data_lines = []
    for field in fields:
        val = response.data_json.get(field['id'], response.data_json.get(field['label'], '—'))
        data_lines.append(f"• {field['label']}: {val}")

    subject = f'[FormCraft] New response — {form.title}'
    message = (
        f"You received a new response to your form: {form.title}\n"
        f"Submitted at: {response.submitted_at.strftime('%d %b %Y, %I:%M %p IST')}\n\n"
        f"Response details:\n" + '\n'.join(data_lines) +
        f"\n\n---\nFormCraft Notifications"
    )

    # Send in background thread so submission isn't blocked
    t = threading.Thread(target=_send, args=(subject, message, form_settings.notify_email))
    t.daemon = True
    t.start()
