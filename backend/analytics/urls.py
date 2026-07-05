from django.urls import path
from . import views

urlpatterns = [
    path('view/',                   views.record_view,       name='record_view'),
    path('<uuid:slug>/summary/',    views.analytics_summary, name='analytics_summary'),
    path('<uuid:slug>/reset-views/',views.reset_views,       name='reset_views'),
]
