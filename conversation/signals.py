from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ConversationMessage

@receiver([post_save, post_delete], sender=ConversationMessage)
def update_unread_cache(sender, instance, **kwargs):
    # Clear cache for all participants except sender
    for user in instance.conversation.members.exclude(id=instance.created_by.id):
        cache_key = f"unread_{user.id}_{instance.conversation.id}"
        cache.delete(cache_key)