from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib import messages
from item.models import Category, Item
from .forms import SignupForm, CustomLoginForm
from django.contrib.auth import login, authenticate
from django.contrib.auth.views import LoginView
from conversation.models import ConversationMessage  # Add this import

def index(request):
    items = Item.objects.filter(is_sold=False)
    categories = Category.objects.all()
    
    # Add unread count to context
    context = {
        'categories': categories,
        'items': items,
    }
    
    if request.user.is_authenticated:
        context['unread_messages_count'] = ConversationMessage.objects.filter(
            conversation__members=request.user,
            is_read=False
        ).exclude(created_by=request.user).count()
    
    return render(request, 'core/index.html', context)

def contact(request):
    context = {}
    if request.user.is_authenticated:
        context['unread_messages_count'] = ConversationMessage.objects.filter(
            conversation__members=request.user,
            is_read=False
        ).exclude(created_by=request.user).count()
    return render(request, 'core/contact.html', context)

def signup(request):
    if request.method == 'POST':
        form = SignupForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, "Signup successful! Welcome !!!")
            return redirect(reverse('core:index'))
    else:
        form = SignupForm()
    
    context = {'form': form}
    if request.user.is_authenticated:
        context['unread_messages_count'] = ConversationMessage.objects.filter(
            conversation__members=request.user,
            is_read=False
        ).exclude(created_by=request.user).count()
    
    return render(request, 'core/signup.html', context)

class CustomLoginView(LoginView):
    form_class = CustomLoginForm
    template_name = 'core/login.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        if self.request.user.is_authenticated:
            context['unread_messages_count'] = ConversationMessage.objects.filter(
                conversation__members=self.request.user,
                is_read=False
            ).exclude(created_by=self.request.user).count()
        return context