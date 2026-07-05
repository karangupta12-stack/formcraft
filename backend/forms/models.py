from django.db import models
from django.conf import settings
import uuid


class Form(models.Model):
    """
    Multiple forms per user.
    Each form has a unique slug derived from UUID.
    """
    STATUS_CHOICES = [('active', 'Active'), ('closed', 'Closed'), ('draft', 'Draft')]

    owner       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='forms')
    slug        = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    title       = models.CharField(max_length=300, default='Untitled Form')
    description = models.TextField(blank=True, default='')
    fields_json = models.JSONField(default=list)
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    # Limits & expiry
    max_responses  = models.PositiveIntegerField(null=True, blank=True, help_text='Leave blank for unlimited')
    expires_at     = models.DateTimeField(null=True, blank=True, help_text='Leave blank for no expiry')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fc_forms'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.owner.username} — {self.title}'

    @property
    def public_url_slug(self):
        return str(self.slug)

    def is_accepting(self):
        from django.utils import timezone
        if self.status != 'active':
            if self.status == 'draft':
                return False, 'This form is still in draft mode.'
            return False, 'This form is closed and is not accepting responses.'
        if self.expires_at and timezone.now() > self.expires_at:
            return False, 'This form has expired.'
        if self.max_responses is not None:
            count = self.responses.count()
            if count >= self.max_responses:
                return False, f'This form has reached its maximum of {self.max_responses} responses.'
        return True, ''


class FormSettings(models.Model):
    LIMIT_CHOICES = [('unlimited', 'Unlimited'), ('browser', 'One per browser'), ('email', 'One per email')]

    form                   = models.OneToOneField(Form, on_delete=models.CASCADE, related_name='settings')
    confirmation_message   = models.CharField(max_length=500, default='Your response has been recorded!')
    submission_limit_mode  = models.CharField(max_length=20, choices=LIMIT_CHOICES, default='unlimited')
    password_hash          = models.CharField(max_length=64, blank=True, default='')
    # Email notifications
    notify_email           = models.EmailField(blank=True, default='')
    notify_on_submit       = models.BooleanField(default=False)
    # Redirect after submit
    redirect_url           = models.URLField(blank=True, default='')

    class Meta:
        db_table = 'fc_form_settings'


class FormBranding(models.Model):
    FONT_CHOICES = [
        ('Inter','Inter'), ('Poppins','Poppins'), ('Roboto','Roboto'),
        ('Playfair Display','Playfair Display'), ('Space Grotesk','Space Grotesk'),
    ]

    form            = models.OneToOneField(Form, on_delete=models.CASCADE, related_name='branding')
    primary_color   = models.CharField(max_length=7,  default='#7c3aed')
    font            = models.CharField(max_length=30,  choices=FONT_CHOICES, default='Inter')
    logo            = models.ImageField(upload_to='logos/',   null=True, blank=True)
    banner          = models.ImageField(upload_to='banners/', null=True, blank=True)
    bg_color        = models.CharField(max_length=7,  default='#0f0f1a')
    bg_type         = models.CharField(max_length=10, default='solid')
    bg_pattern      = models.CharField(max_length=10, default='dots')

    class Meta:
        db_table = 'fc_form_branding'
