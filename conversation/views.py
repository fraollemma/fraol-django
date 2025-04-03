from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404, redirect
from .models import Conversation, ConversationMessage
from item.models import Item
from .forms import ConversationMessageForm
from django.core.cache import cache



@login_required
def inbox(request):
    conversations = Conversation.objects.filter(
        members=request.user
    ).prefetch_related('members', 'item', 'messages')
    
    # Get unread counts using Redis cache
    unread_counts = {}
    for conv in conversations:
        cache_key = f"unread_{request.user.id}_{conv.id}"
        unread = cache.get(cache_key)
        
        if unread is None:
            unread = ConversationMessage.objects.filter(
                conversation=conv,
                is_read=False
            ).exclude(created_by=request.user).count()
            cache.set(cache_key, unread, timeout=300)  # Cache for 5 minutes
        
        unread_counts[str(conv.id)] = unread
    
    return render(request, 'conversation/inbox.html', {
        'conversations': conversations,
        'unread_counts': unread_counts,
    })

@login_required
def inbox(request):
    conversations = Conversation.objects.filter(members=request.user).prefetch_related('members', 'item')
    
    unread_counts = {
        str(conv.id): ConversationMessage.objects.filter(
            conversation=conv,
            is_read=False
        ).exclude(created_by=request.user).count()
        for conv in conversations
    }
    
    return render(request, 'conversation/inbox.html', {
        'conversations': conversations,
        'unread_counts': unread_counts,
    })

@login_required
def new_conversation(request, item_pk):
    item = get_object_or_404(Item, pk=item_pk)
    
    if item.created_by == request.user:
        return redirect('dashboard:index')
    
    # Check for existing conversation
    conversation = Conversation.objects.filter(
        item=item,
        members=request.user
    ).first()
    
    if conversation:
        return redirect('conversation:detail', pk=conversation.id)

    if request.method == 'POST':
        form = ConversationMessageForm(request.POST)
        if form.is_valid():
            conversation = Conversation.objects.create(item=item)
            conversation.members.add(request.user, item.created_by)
            
            conversation_message = form.save(commit=False)
            conversation_message.conversation = conversation
            conversation_message.created_by = request.user
            conversation_message.save()
            
            return redirect('conversation:detail', pk=conversation.id)
    else:
        form = ConversationMessageForm()

    return render(request, 'conversation/new.html', {
        'form': form,
        'item': item
    })

@login_required
def detail(request, pk):
    conversation = get_object_or_404(
        Conversation.objects.filter(members=request.user),
        pk=pk
    )
    
    # Mark messages as read
    ConversationMessage.objects.filter(
        conversation=conversation,
        is_read=False
    ).exclude(created_by=request.user).update(is_read=True)

    if request.method == 'POST':
        form = ConversationMessageForm(request.POST)
        if form.is_valid():
            conversation_message = form.save(commit=False)
            conversation_message.conversation = conversation
            conversation_message.created_by = request.user
            conversation_message.save()
            
            conversation.save()  # Updates modified_at
            return redirect('conversation:detail', pk=pk)
    else:
        form = ConversationMessageForm()

    return render(request, 'conversation/detail.html', {
        'conversation': conversation,
        'form': form
    })