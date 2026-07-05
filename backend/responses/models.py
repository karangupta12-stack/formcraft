from django.db import models
from forms.models import Form


class Response(models.Model):
    form             = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='responses')
    data_json        = models.JSONField(default=dict)
    submitted_at     = models.DateTimeField(auto_now_add=True)
    fingerprint      = models.CharField(blank=True, default='')
    email            = models.EmailField(blank=True, default='')
    time_to_complete = models.PositiveIntegerField(default=0)
    ip_address       = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'fc_responses'
        ordering = ['-submitted_at']

    def __str__(self):
        return f'Response #{self.id} — {self.form.title}'


class UploadedFile(models.Model):
    """Stores file uploaded via a file-type form field."""
    response  = models.ForeignKey(Response, on_delete=models.CASCADE, related_name='files', null=True, blank=True)
    form      = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='uploaded_files')
    field_id  = models.CharField(max_length=100)
    file      = models.FileField(upload_to='form_uploads/')
    filename  = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fc_uploaded_files'


class Session(models.Model):
    STATUS_CHOICES = [('started','Started'),('completed','Completed'),('abandoned','Abandoned')]
    form          = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='sessions')
    status        = models.CharField(max_length=12, choices=STATUS_CHOICES, default='started')
    last_step     = models.PositiveSmallIntegerField(default=0)
    last_field_id = models.CharField(max_length=64, blank=True, default='')
    started_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fc_sessions'
