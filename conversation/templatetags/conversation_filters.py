from django import template
from conversation.models import ConversationMessage

register = template.Library()

@register.filter(name='get_unread_count')
def get_unread_count(unread_counts, conversation_id):
    """
    Gets unread count from dictionary safely.
    Usage: {{ unread_counts|get_unread_count:conversation.id }}
    """
    return unread_counts.get(str(conversation_id), 0)



@register.filter(name='unread_messages_count')
def unread_messages_count(user):
    return ConversationMessage.objects.filter(
        conversation__members=user,
        is_read=False
    ).exclude(created_by=user).count()