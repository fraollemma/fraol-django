from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/conversation/<uuid:conversation_id>/', consumers.ConversationConsumer.as_asgi()),
    path('ws/user/<int:user_id>/', consumers.UserNotificationsConsumer.as_asgi()),
]