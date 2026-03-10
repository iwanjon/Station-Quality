from db_manager.models import Users
from django import forms
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


class UsersAdminForm(forms.ModelForm):
    class Meta:
        model = Users
        fields = '__all__'

    def clean_email(self):
        email = self.cleaned_data.get('email')
        try:
            validate_email(email)
        except ValidationError:
            raise forms.ValidationError("Invalid email format.")
        return email

    def clean_password_hash(self):
        password = self.cleaned_data.get('password_hash')
        if password and not password.startswith('$2'):
            if len(password) < 4:
                raise forms.ValidationError("Password must be at least 4 characters long.")
        return password