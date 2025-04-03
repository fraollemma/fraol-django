/**
 * Fraollemma - Base Application JavaScript
 * Handles all global functionality with smooth transitions
 */

class AppCore {
    constructor() {
      this.currentUser = document.body.dataset.userId;
      this.isReloading = false;
      this.init();
    }
  
    init() {
      this.setupMobileMenu();
      this.setupUnreadCounter();
      this.setupFlashMessages();
      this.setupForms();
      this.setupWebSocket();
      this.updateCopyrightYear();
      this.setupSmoothTransitions();
    }
  
    // 1. Mobile Menu Toggle
    setupMobileMenu() {
      const menuToggle = document.querySelector('.mobile-menu-toggle');
      const navMenu = document.querySelector('.nav-menu');
      
      if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
          const isOpen = navMenu.classList.toggle('active');
          menuToggle.setAttribute('aria-expanded', isOpen);
          menuToggle.classList.toggle('open');
          document.body.style.overflow = isOpen ? 'hidden' : '';
        });
      }
    }
  
    // 2. Unread Counter System
    setupUnreadCounter() {
      this.unreadCounter = {
        element: document.querySelector('.nav-unread-count'),
        count: parseInt(localStorage.getItem('unreadCount')) || 0,
        
        init() {
          const domCount = parseInt(this.element?.textContent);
          if (!isNaN(domCount)) this.count = domCount;
          this.update();
        },
        
        update(newCount) {
          if (newCount !== undefined) {
            this.count = newCount;
            localStorage.setItem('unreadCount', this.count);
          }
          
          if (this.element) {
            this.element.textContent = this.count;
            this.element.classList.toggle('empty', this.count === 0);
            
            if (this.count > 0) {
              this.animate();
              this.updateDocumentTitle();
              this.vibrateDevice();
            }
          }
        },
        
        animate() {
          this.element.classList.add('pulse');
          setTimeout(() => this.element.classList.remove('pulse'), 500);
        },
        
        updateDocumentTitle() {
          document.title = this.count > 0 
            ? `(${this.count}) ${document.title.replace(/^\(\d+\)\s/, '')}`
            : document.title.replace(/^\(\d+\)\s/, '');
        },
        
        vibrateDevice() {
          if (navigator.vibrate && document.visibilityState !== 'visible') {
            navigator.vibrate(200);
          }
        }
      };
      
      this.unreadCounter.init();
    }
  
    // 3. Flash Messages
    setupFlashMessages() {
      document.querySelectorAll('.alert').forEach(message => {
        setTimeout(() => {
          message.style.opacity = '0';
          setTimeout(() => message.remove(), 300);
        }, 5000);
      });
    }
  
    // 4. Form Handling
    setupForms() {
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
          const submitButton = form.querySelector('button[type="submit"]');
          if (submitButton) {
            const originalHTML = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `
              <i class="fas fa-spinner fa-spin"></i>
              ${submitButton.textContent.trim()}
            `;
            
            setTimeout(() => {
              if (submitButton.disabled) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalHTML;
              }
            }, 10000);
          }
        });
      });
    }
  
    // 5. WebSocket with Smooth Updates
    setupWebSocket() {
      if (!this.currentUser || typeof WebSocket === 'undefined') return;
      
      this.socket = new WebSocket(
        `wss://${window.location.host}/ws/user/${this.currentUser}/`
      );
  
      this.socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'unread_update') {
            this.unreadCounter.update(data.count);
            this.showNotification(`New message: ${data.count} unread`);
          } else if (data.type === 'content_update') {
            this.updateContent(data.html);
          }
        } catch (error) {
          console.error('WebSocket error:', error);
        }
      };
  
      this.socket.onclose = () => {
        if (!this.isReloading) {
          this.scheduleSoftReload();
        }
      };
    }
  
    // 6. Smooth Content Updates
    async updateContent(newHTML) {
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(newHTML, 'text/html');
      
      document.querySelectorAll('[data-update]').forEach(el => {
        const selector = el.dataset.update;
        const newContent = newDoc.querySelector(selector);
        if (newContent) {
          el.style.opacity = 0;
          setTimeout(() => {
            el.innerHTML = newContent.innerHTML;
            el.style.opacity = 1;
          }, 300);
        }
      });
    }
  
    // 7. Soft Reload System
    scheduleSoftReload() {
      this.isReloading = true;
      document.body.classList.add('reloading');
      
      setTimeout(async () => {
        if (!navigator.onLine) {
          this.showOfflineMessage();
        } else {
          await this.fetchUpdates();
        }
        document.body.classList.remove('reloading');
        this.isReloading = false;
      }, 5000);
    }
  
    async fetchUpdates() {
      try {
        const response = await fetch(window.location.href, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const html = await response.text();
        this.updateContent(html);
      } catch (error) {
        console.error('Update failed:', error);
      }
    }
  
    // 8. Visual Enhancements
    setupSmoothTransitions() {
      // CSS transitions are handled via the stylesheet
    }
  
    // Helper Methods
    showNotification(message) {
      if (!('Notification' in window) || document.visibilityState === 'visible') return;
      
      if (Notification.permission === 'granted') {
        new Notification(message);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') new Notification(message);
        });
      }
    }
  
    showOfflineMessage() {
      const offlineMessage = document.createElement('div');
      offlineMessage.className = 'alert offline-message';
      offlineMessage.textContent = 'Connection lost. Trying to reconnect...';
      document.body.prepend(offlineMessage);
      setTimeout(() => offlineMessage.remove(), 5000);
    }
  
    updateCopyrightYear() {
      const yearElement = document.getElementById('year');
      if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
      }
    }
  }
  
  // Initialize with smooth transitions
  document.addEventListener('DOMContentLoaded', () => {
    // Add transition class to body
    document.body.classList.add('smooth-transitions');
    
    // Initialize app
    window.FraollemmaApp = new AppCore();
  });





















  // JavaScript for navbar functionality
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (mobileMenuToggle && navLinks) {
      mobileMenuToggle.addEventListener('click', function() {
          navLinks.classList.toggle('active');
          mobileMenuToggle.innerHTML = navLinks.classList.contains('active') ? 
              '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
      });
  }
  
  // Background image rotation
  const navbar = document.getElementById('dynamic-navbar');
  const images = [
      "{% static 'img/LOGO.jpg' %}",
      "{% static 'img/chicken 6.jpg' %}",
      "{% static 'img/download (1).jpg' %}"
  ];
  
  if (navbar && images.length > 0) {
      let currentIndex = 0;
      
      function changeBackground() {
          currentIndex = (currentIndex + 1) % images.length;
          navbar.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${images[currentIndex]})`;
      }
      
      // Set initial background
      navbar.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${images[0]})`;
      
      // Change every 5 seconds
      setInterval(changeBackground, 5000);
  }
  
  // Close mobile menu when clicking a link
  const navItems = document.querySelectorAll('.core-nav-link, .core-btn-primary, .core-btn-secondary');
  navItems.forEach(item => {
      item.addEventListener('click', function() {
          if (navLinks.classList.contains('active')) {
              navLinks.classList.remove('active');
              mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
          }
      });
  });
});