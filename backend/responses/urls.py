from django.urls import path
from . import views

urlpatterns = [
    path('upload/',                              views.upload_file,    name='upload_file'),
    path('submit/',                              views.submit_response,name='submit_response'),
    path('session/',                             views.track_session,  name='track_session'),
    path('<uuid:slug>/',                         views.list_responses, name='list_responses'),
    path('<uuid:slug>/<int:pk>/edit/',           views.edit_response,  name='edit_response'),
    path('<uuid:slug>/<int:pk>/delete/',         views.delete_response,name='delete_response'),
    path('<uuid:slug>/clear/',                   views.clear_responses,name='clear_responses'),
    path('<uuid:slug>/export/',                  views.export_excel,   name='export_excel'),
]
