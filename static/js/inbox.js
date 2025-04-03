class InboxManager {
    constructor() {
        this.socket = null;
        this.userId = document.body.dataset.userId;
        
        if (!this.userId) {
            console.error('User ID not found on body element');
            return;
        }
        
        this.initWebSocket();
        this.setupEventListeners();
        this.setupReconnect();
    }
    
    initWebSocket() {
        try {
            this.socket = new WebSocket(
                `ws://${window.location.host}/ws/user/${this.userId}/`
            );
            
            this.socket.onopen = () => {
                console.log('WebSocket connection established');
            };
            
            this.socket.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === 'unread_update') {
                        this.updateUnreadCount(data.conversation_id, data.count);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            this.socket.onclose = (e) => {
                console.log('WebSocket connection closed', e);
            };
        } catch (error) {
            console.error('WebSocket initialization error:', error);
        }
    }
    
    setupEventListeners() {
        document.querySelectorAll('.conversation-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Prevent marking as read if middle-click or ctrl+click
                if (e.ctrlKey || e.metaKey || e.button === 1) {
                    return;
                }
                
                const conversationId = link.dataset.conversationId;
                this.markAsRead(conversationId);
            });
        });
    }
    
    setupReconnect() {
        // Attempt to reconnect every 5 seconds if connection drops
        setInterval(() => {
            if (this.socket && (this.socket.readyState === WebSocket.CLOSED)) {
                console.log('Attempting to reconnect WebSocket...');
                this.initWebSocket();
            }
        }, 5000);
    }
    
    updateUnreadCount(conversationId, count) {
        const unreadElement = document.getElementById(`unread-${conversationId}`);
        const conversationCard = document.querySelector(
            `.conversation-link[data-conversation-id="${conversationId}"] .conversation-card`
        );
        
        if (!unreadElement) return;
        
        if (count > 0) {
            unreadElement.textContent = count;
            unreadElement.style.display = 'inline-block';
            if (conversationCard) {
                conversationCard.classList.add('unread');
            }
        } else {
            unreadElement.style.display = 'none';
            if (conversationCard) {
                conversationCard.classList.remove('unread');
            }
        }
    }
    
    markAsRead(conversationId) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not ready, cannot mark as read');
            return;
        }
        
        try {
            this.socket.send(JSON.stringify({
                type: 'mark_read',
                conversation_id: conversationId
            }));
        } catch (error) {
            console.error('Error sending mark_read message:', error);
        }
    }
  }
  
  // Initialize only when the DOM is fully loaded
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
          if (document.querySelector('.inbox-container')) {
              new InboxManager();
          }
      });
  } else {
      if (document.querySelector('.inbox-container')) {
          new InboxManager();
      }
  }