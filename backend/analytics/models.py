from django.db import models
from forms.models import Form

class FormView(models.Model):
    form      = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='views')
    viewed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    class Meta:
        db_table = 'fc_views'
