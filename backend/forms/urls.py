from django.urls import path
from . import views

urlpatterns = [
    path('',                        views.list_forms,     name='list_forms'),
    path('create/',                 views.create_form,    name='create_form'),
    path('<uuid:slug>/',            views.form_detail,    name='form_detail'),
    path('<uuid:slug>/duplicate/',  views.duplicate_form, name='duplicate_form'),
    path('<uuid:slug>/settings/',   views.update_settings,name='update_settings'),
    path('<uuid:slug>/branding/',   views.update_branding,name='update_branding'),
    path('<uuid:slug>/qr/',         views.get_qr,         name='get_qr'),
    path('<uuid:slug>/embed/',      views.get_embed,      name='get_embed'),
    path('public/<uuid:slug>/',     views.public_form,    name='public_form'),
]
