import io
import base64
import qrcode
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Form, FormSettings, FormBranding
from .serializers import (
    FormSerializer, FormListSerializer, FormCreateSerializer,
    FormSettingsSerializer, FormBrandingSerializer, PublicFormSerializer,
)


def _bootstrap(form):
    """Ensure every form has settings + branding rows."""
    FormSettings.objects.get_or_create(form=form)
    FormBranding.objects.get_or_create(form=form)


# ── Admin: List all forms ─────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_forms(request):
    forms = Form.objects.filter(owner=request.user)
    return Response(FormListSerializer(forms, many=True).data)


# ── Admin: Create new form ────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_form(request):
    s = FormCreateSerializer(data=request.data)
    if s.is_valid():
        form = s.save(owner=request.user)
        _bootstrap(form)
        return Response(FormSerializer(form).data, status=201)
    return Response(s.errors, status=400)


# ── Admin: Get / Update / Delete single form ──────────────────────────────────
@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def form_detail(request, slug):
    try:
        form = Form.objects.get(slug=slug, owner=request.user)
    except Form.DoesNotExist:
        return Response({'error': 'Form not found.'}, status=404)

    if request.method == 'GET':
        _bootstrap(form)
        return Response(FormSerializer(form).data)

    if request.method == 'PATCH':
        s = FormCreateSerializer(form, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(FormSerializer(form).data)
        return Response(s.errors, status=400)

    if request.method == 'DELETE':
        form.delete()
        return Response(status=204)


# ── Admin: Duplicate form ─────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def duplicate_form(request, slug):
    try:
        original = Form.objects.select_related('settings', 'branding').get(slug=slug, owner=request.user)
    except Form.DoesNotExist:
        return Response({'error': 'Form not found.'}, status=404)

    new_form = Form.objects.create(
        owner       = request.user,
        title       = f'Copy of {original.title}',
        description = original.description,
        fields_json = original.fields_json,
        status      = 'draft',
        max_responses = original.max_responses,
    )

    orig_s = original.settings
    FormSettings.objects.create(
        form                  = new_form,
        confirmation_message  = orig_s.confirmation_message,
        submission_limit_mode = orig_s.submission_limit_mode,
        notify_email          = orig_s.notify_email,
        notify_on_submit      = orig_s.notify_on_submit,
    )

    orig_b = original.branding
    FormBranding.objects.create(
        form          = new_form,
        primary_color = orig_b.primary_color,
        font          = orig_b.font,
        logo          = orig_b.logo,
        banner        = orig_b.banner,
        bg_color      = orig_b.bg_color,
        bg_type       = orig_b.bg_type,
        bg_pattern    = orig_b.bg_pattern,
    )

    return Response(FormSerializer(new_form).data, status=201)


# ── Admin: Update settings ────────────────────────────────────────────────────
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_settings(request, slug):
    try:
        form = Form.objects.get(slug=slug, owner=request.user)
    except Form.DoesNotExist:
        return Response({'error': 'Form not found.'}, status=404)
    obj, _ = FormSettings.objects.get_or_create(form=form)
    s = FormSettingsSerializer(obj, data=request.data, partial=True)
    if s.is_valid():
        s.save()
        return Response(s.data)
    return Response(s.errors, status=400)


# ── Admin: Update branding (supports file upload) ─────────────────────────────
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, JSONParser])
def update_branding(request, slug):
    try:
        form = Form.objects.get(slug=slug, owner=request.user)
    except Form.DoesNotExist:
        return Response({'error': 'Form not found.'}, status=404)
    obj, _ = FormBranding.objects.get_or_create(form=form)
    s = FormBrandingSerializer(obj, data=request.data, partial=True, context={'request': request})
    if s.is_valid():
        s.save()
        return Response(FormBrandingSerializer(obj, context={'request': request}).data)
    return Response(s.errors, status=400)


# ── Admin: QR Code ────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_qr(request, slug):
    try:
        form = Form.objects.get(slug=slug, owner=request.user)
    except Form.DoesNotExist:
        return Response({'error': 'Form not found.'}, status=404)

    frontend_origin = request.headers.get('Origin', 'http://localhost:5173')
    form_url = f'{frontend_origin}/f/{str(form.slug)}'

    qr = qrcode.QRCode(version=1, box_size=8, border=4)
    qr.add_data(form_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color='#7c3aed', back_color='white')

    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    b64 = base64.b64encode(buffer.getvalue()).decode()
    return Response({'qr_base64': f'data:image/png;base64,{b64}', 'form_url': form_url})


# ── Admin: Embed code ─────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_embed(request, slug):
    try:
        form = Form.objects.get(slug=slug, owner=request.user)
    except Form.DoesNotExist:
        return Response({'error': 'Form not found.'}, status=404)

    frontend_origin = request.headers.get('Origin', 'http://localhost:5173')
    form_url = f'{frontend_origin}/f/{str(form.slug)}'
    embed_code = f'<iframe src="{form_url}" width="100%" height="600" frameborder="0" style="border:none;border-radius:12px;"></iframe>'
    return Response({'embed_code': embed_code, 'form_url': form_url})


# ── Public: Get form by slug ──────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def public_form(request, slug):
    try:
        form = Form.objects.select_related('settings', 'branding').get(slug=slug)
    except Form.DoesNotExist:
        return Response({'error': 'Form not found.'}, status=404)
    return Response(PublicFormSerializer(form, context={'request': request}).data)
