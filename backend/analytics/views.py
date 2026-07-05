from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from forms.models import Form
from responses.models import Response as ResponseModel, Session
from .models import FormView


@api_view(['POST'])
@permission_classes([AllowAny])
def record_view(request):
    slug = request.data.get('form_slug', '')
    try:
        form = Form.objects.get(slug=slug)
        FormView.objects.create(form=form, ip_address=request.META.get('REMOTE_ADDR'))
        return Response({'ok': True})
    except Form.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_summary(request, slug):
    try:
        form = Form.objects.get(slug=slug, owner=request.user)
    except Form.DoesNotExist:
        return Response({'error': 'Form not found.'}, status=404)

    now   = timezone.now()
    today = now.date()

    responses    = ResponseModel.objects.filter(form=form)
    sessions     = Session.objects.filter(form=form)
    views_count  = FormView.objects.filter(form=form).count()
    submissions  = responses.count()
    started      = sessions.count()
    abandoned    = sessions.filter(status='abandoned').count()
    completed_s  = sessions.filter(status='completed').count()
    today_subs   = responses.filter(submitted_at__date=today).count()

    times        = list(responses.exclude(time_to_complete=0).values_list('time_to_complete', flat=True))
    avg_seconds  = round(sum(times) / len(times)) if times else 0

    conversion_rate  = round((submissions / views_count) * 100, 1) if views_count else 0
    abandonment_rate = round((abandoned / started) * 100, 1) if started else 0
    completion_rate  = round((completed_s / started) * 100, 1) if started else (100 if submissions else 0)

    # Last 30 days
    labels, counts = [], []
    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        labels.append(day.strftime('%m-%d'))
        counts.append(responses.filter(submitted_at__date=day).count())

    # Question breakdown
    question_stats = []
    for field in form.fields_json:
        if field.get('type') in ('select', 'radio', 'checkbox'):
            counts_map = {opt: 0 for opt in field.get('options', [])}
            for r in responses:
                val = r.data_json.get(field['id'], r.data_json.get(field['label'], ''))
                if field['type'] == 'checkbox':
                    for v in (str(val).split(',') if val else []):
                        v = v.strip()
                        if v: counts_map[v] = counts_map.get(v, 0) + 1
                elif val:
                    counts_map[val] = counts_map.get(val, 0) + 1
            question_stats.append({'field_id': field['id'], 'label': field['label'], 'counts': counts_map})

    return Response({
        'views': views_count, 'submissions': submissions, 'today_submissions': today_subs,
        'conversion_rate': conversion_rate, 'completion_rate': completion_rate,
        'abandonment_rate': abandonment_rate, 'started_not_submitted': abandoned,
        'avg_seconds': avg_seconds,
        'chart': {'labels': labels, 'counts': counts},
        'question_stats': question_stats,
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def reset_views(request, slug):
    try:
        form = Form.objects.get(slug=slug, owner=request.user)
        FormView.objects.filter(form=form).delete()
        return Response({'message': 'Views reset.'})
    except Form.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)
