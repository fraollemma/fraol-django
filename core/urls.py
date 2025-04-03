from django.contrib.auth.views import LoginView
from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.index, name='index'),
    path('contact/', views.contact, name='contact'),
    path('signup/', views.signup, name="signup"),
    path('login/', views.CustomLoginView.as_view(), name='login'),  # ✅ Fixed
]
