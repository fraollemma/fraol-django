import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Conversation, ConversationMessage
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist

User = get_user_model()

class ConversationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        
        try:
            # Verify conversation exists and user has access
            conversation = await Conversation.objects.select_related('item').aget(pk=self.conversation_id)
            user = self.scope["user"]
            
            if user not in conversation.members.all():
                await self.close(code=4001)  # Custom unauthorized code
                return
                
        except ObjectDoesNotExist:
            await self.close(code=4002)  # Custom not found code
            return
        except Exception as e:
            print(f"Unexpected connect error: {e}")
            await self.close(code=4000)  # Custom internal error code
            return

        try:
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
        except Exception as e:
            print(f"WebSocket accept error: {e}")
            await self.close(code=4003)  # Custom connection error code

    async def disconnect(self, close_code):
        try:
            if hasattr(self, 'room_group_name'):
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
            print(f"Disconnected with code: {close_code}")
        except Exception as e:
            print(f"Disconnect error: {e}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_content = data.get('message', '').strip()
            sender_username = data.get('sender')
            
            if not message_content:
                raise ValueError("Message content cannot be empty")
            if not sender_username:
                raise ValueError("Sender username is required")

            # Get conversation and sender with optimized queries
            conversation = await Conversation.objects.select_related('item').aget(pk=self.conversation_id)
            sender = await User.objects.aget(username=sender_username)
            
            # Update conversation timestamp
            conversation.modified_at = timezone.now()
            await conversation.asave()

            # Create and save message
            message = await ConversationMessage.objects.acreate(
                conversation=conversation,
                content=message_content,
                created_by=sender
            )

            # Update unread counts for other members
            members = await conversation.members.all().aiterator()
            async for member in members:
                if member.id != sender.id:
                    cache_key = f"unread_{member.id}_{conversation.id}"
                    try:
                        cache.incr(cache_key)
                        current_count = cache.get(cache_key, 0)
                        
                        await self.channel_layer.group_send(
                            f"user_{member.id}",
                            {
                                "type": "unread_update",
                                "conversation_id": conversation.id,
                                "count": current_count
                            }
                        )
                    except Exception as e:
                        print(f"Error updating unread count: {e}")

            # Broadcast message to conversation group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message.content,
                    'sender': sender.username,
                    'timestamp': message.created_at.isoformat(),
                    'message_id': str(message.id)
                }
            )

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except ObjectDoesNotExist as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
        except Exception as e:
            print(f"Error in receive: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'An error occurred'
            }))

    async def chat_message(self, event):
        try:
            await self.send(text_data=json.dumps({
                'type': 'chat',
                'message': event['message'],
                'sender': event['sender'],
                'timestamp': event['timestamp'],
                'message_id': event.get('message_id', '')
            }))
        except Exception as e:
            print(f"Error sending chat message: {e}")

    async def unread_update(self, event):
        try:
            await self.send(text_data=json.dumps({
                "type": "unread_update",
                "conversation_id": event["conversation_id"],
                "count": event["count"]
            }))
        except Exception as e:
            print(f"Error sending unread update: {e}")





class UserNotificationsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.user_group_name = f'user_{self.user_id}'
        
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Handle mark-as-read requests
        data = json.loads(text_data)
        if data.get('type') == 'mark_read':
            conversation_id = data['conversation_id']
            cache_key = f'unread_{self.user_id}_{conversation_id}'
            cache.set(cache_key, 0)

    async def unread_update(self, event):
        # Send unread count updates to client
        await self.send(text_data=json.dumps({
            "type": "unread_update",
            "conversation_id": event["conversation_id"],
            "count": event["count"]
        }))