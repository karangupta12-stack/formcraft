from django.contrib import admin
from .models import Response, UploadedFile, Session

admin.site.register(Response)
admin.site.register(UploadedFile)
admin.site.register(Session)