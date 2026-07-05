from django.contrib import admin
from .models import Form, FormSettings, FormBranding

admin.site.register(Form)
admin.site.register(FormSettings)
admin.site.register(FormBranding)