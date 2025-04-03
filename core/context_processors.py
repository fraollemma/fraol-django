# core/context_processors.py
from django.core.cache import cache
from conversation.models import ConversationMessage

def unread_messages(request):
    """
    Context processor that adds unread message count to every template context.
    Uses caching to optimize performance.
    """
    if request.user.is_authenticated:
        cache_key = f"user_{request.user.id}_unread_count"
        count = cache.get(cache_key)
        
        if count is None:
            count = ConversationMessage.objects.filter(
                conversation__members=request.user,
                is_read=False
            ).exclude(created_by=request.user).count()
            # Cache for 5 minutes (300 seconds)
            cache.set(cache_key, count, 300)
        
        return {'unread_messages_count': count}
    return {}