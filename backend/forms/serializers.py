from rest_framework import serializers
from .models import Form, FormSettings, FormBranding


class FormSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FormSettings
        fields = ['confirmation_message', 'submission_limit_mode', 'password_hash',
                  'notify_email', 'notify_on_submit', 'redirect_url']


class FormBrandingSerializer(serializers.ModelSerializer):
    logo_url   = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()

    class Meta:
        model  = FormBranding
        fields = ['primary_color', 'font', 'logo', 'logo_url', 'banner', 'banner_url',
                  'bg_color', 'bg_type', 'bg_pattern']
        extra_kwargs = {'logo': {'write_only': True}, 'banner': {'write_only': True}}

    def get_logo_url(self, obj):
        if obj.logo:
            req = self.context.get('request')
            return req.build_absolute_uri(obj.logo.url) if req else obj.logo.url
        return ''

    def get_banner_url(self, obj):
        if obj.banner:
            req = self.context.get('request')
            return req.build_absolute_uri(obj.banner.url) if req else obj.banner.url
        return ''


class FormSerializer(serializers.ModelSerializer):
    settings         = FormSettingsSerializer(read_only=True)
    branding         = FormBrandingSerializer(read_only=True)
    owner_username   = serializers.CharField(source='owner.username', read_only=True)
    response_count   = serializers.SerializerMethodField()
    public_url_slug  = serializers.ReadOnlyField()

    class Meta:
        model  = Form
        fields = ['id', 'slug', 'public_url_slug', 'owner_username', 'title', 'description',
                  'fields_json', 'status', 'max_responses', 'expires_at',
                  'settings', 'branding', 'response_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'owner_username', 'created_at', 'updated_at']

    def get_response_count(self, obj):
        return obj.responses.count()


class FormListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dashboard list view."""
    response_count = serializers.SerializerMethodField()

    class Meta:
        model  = Form
        fields = ['id', 'slug', 'title', 'description', 'status', 'max_responses',
                  'expires_at', 'response_count', 'created_at', 'updated_at']

    def get_response_count(self, obj):
        return obj.responses.count()


class FormCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Form
        fields = ['title', 'description', 'fields_json', 'status', 'max_responses', 'expires_at']


class PublicFormSerializer(serializers.ModelSerializer):
    settings = serializers.SerializerMethodField()
    branding = FormBrandingSerializer(read_only=True)

    class Meta:
        model  = Form
        fields = ['title', 'description', 'fields_json', 'settings', 'branding']

    def get_settings(self, obj):
        s = obj.settings
        accepting, reason = obj.is_accepting()
        return {
            'confirmation_message':  s.confirmation_message,
            'submission_limit_mode': s.submission_limit_mode,
            'is_password_protected': bool(s.password_hash),
            'accept_responses': accepting,
            'closed_reason': reason,
            'password_hash':         s.password_hash,
            'redirect_url':          s.redirect_url,
        }
