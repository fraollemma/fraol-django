from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_verification_email(user):
    subject = "Verify Your Email"
    html_message = render_to_string('core/email_verification.html', {
        'user': user,
        'verification_link': f"https://yourapp.com/verify/{user.pk}/"
    })
    plain_message = strip_tags(html_message)
    send_mail(subject, plain_message, 'noreply@yourapp.com', [user.email], html_message=html_message)