class ConversationSocket {
  constructor(conversationId, currentUser) {
      this.conversationId = conversationId;
      this.currentUser = currentUser;
      this.socket = new WebSocket(
          `ws://${window.location.host}/ws/conversation/${this.conversationId}/`
      );
      
      this.initSocket();
      this.setupEventListeners();
  }
  
  initSocket() {
      this.socket.onopen = (e) => {
          console.log('WebSocket connection established');
      };
      
      this.socket.onmessage = (e) => {
          const data = JSON.parse(e.data);
          
          if (data.type === 'chat') {
              this.handleNewMessage(data);
          } else if (data.type === 'unread_update') {
              this.handleUnreadUpdate(data);
          }
      };
      
      this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
      };
      
      this.socket.onclose = (e) => {
          if (e.wasClean) {
              console.log(`Connection closed cleanly, code=${e.code}, reason=${e.reason}`);
          } else {
              console.log('Connection died');
              // Attempt to reconnect after 5 seconds
              setTimeout(() => {
                  new ConversationSocket(this.conversationId, this.currentUser);
              }, 5000);
          }
      };
  }
  
  setupEventListeners() {
      document.getElementById('message-form').addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleFormSubmit();
      });
  }
  
  handleNewMessage(data) {
      const container = document.getElementById('messages-container');
      const messageDiv = document.createElement('div');
      
      messageDiv.className = `message ${data.sender === this.currentUser ? 'sent' : 'received'}`;
      messageDiv.innerHTML = `
          <div class="message-header">
              <span class="sender">${data.sender}</span>
              <span class="timestamp">${new Date().toLocaleString()}</span>
          </div>
          <div class="message-content">${data.message}</div>
      `;
      
      container.appendChild(messageDiv);
      container.scrollTop = container.scrollHeight;
      
      // Mark as read if it's our message
      if (data.sender === this.currentUser) {
          this.markAsRead();
      }
  }
  
  handleUnreadUpdate(data) {
      // Update UI if we're on the inbox page
      const unreadElement = document.getElementById(`unread-${data.conversation_id}`);
      if (unreadElement) {
          unreadElement.textContent = data.count;
          unreadElement.parentElement.parentElement.classList.toggle('unread', data.count > 0);
      }
  }
  
  handleFormSubmit() {
      const input = document.querySelector('#message-form input[name="content"]');
      if (input.value.trim() && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
              type: 'chat',
              message: input.value.trim(),
              sender: this.currentUser
          }));
          input.value = '';
      }
  }
  
  markAsRead() {
      if (this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
              type: 'read_receipt',
              conversation_id: this.conversationId,
              user: this.currentUser
          }));
      }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const conversationContainer = document.querySelector('.conversation-container');
  if (conversationContainer) {
      const conversationId = conversationContainer.dataset.conversationId;
      const currentUser = conversationContainer.dataset.currentUser;
      
      new ConversationSocket(conversationId, currentUser);
      
      // Scroll to bottom on load
      const messagesContainer = document.getElementById('messages-container');
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});