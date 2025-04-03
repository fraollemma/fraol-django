# core/validators.py
from django.core.exceptions import ValidationError

class EasyPasswordValidator:
    def validate(self, password, user=None):
        if len(password) < 6:
            raise ValidationError("Password must be at least 6 characters")
    
    def get_help_text(self):
        return "Enter any 6+ characters"