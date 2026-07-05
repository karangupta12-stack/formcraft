import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Form',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('title', models.CharField(default='Untitled Form', max_length=300)),
                ('description', models.TextField(blank=True, default='')),
                ('fields_json', models.JSONField(default=list)),
                ('status', models.CharField(
                    choices=[('active', 'Active'), ('closed', 'Closed'), ('draft', 'Draft')],
                    default='active', max_length=10
                )),
                ('max_responses', models.PositiveIntegerField(blank=True, null=True)),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='forms',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'db_table': 'fc_forms',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='FormSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('confirmation_message', models.CharField(default='Your response has been recorded!', max_length=500)),
                ('submission_limit_mode', models.CharField(
                    choices=[('unlimited', 'Unlimited'), ('browser', 'One per browser'), ('email', 'One per email')],
                    default='unlimited', max_length=20
                )),
                ('password_hash', models.CharField(blank=True, default='', max_length=64)),
                ('notify_email', models.EmailField(blank=True, default='')),
                ('notify_on_submit', models.BooleanField(default=False)),
                ('redirect_url', models.URLField(blank=True, default='')),
                ('form', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='settings',
                    to='forms.form'
                )),
            ],
            options={
                'db_table': 'fc_form_settings',
            },
        ),
        migrations.CreateModel(
            name='FormBranding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('primary_color', models.CharField(default='#7c3aed', max_length=7)),
                ('font', models.CharField(
                    choices=[
                        ('Inter', 'Inter'), ('Poppins', 'Poppins'), ('Roboto', 'Roboto'),
                        ('Playfair Display', 'Playfair Display'), ('Space Grotesk', 'Space Grotesk'),
                    ],
                    default='Inter', max_length=30
                )),
                ('logo', models.ImageField(blank=True, null=True, upload_to='logos/')),
                ('banner', models.ImageField(blank=True, null=True, upload_to='banners/')),
                ('bg_color', models.CharField(default='#0f0f1a', max_length=7)),
                ('bg_type', models.CharField(default='solid', max_length=10)),
                ('bg_pattern', models.CharField(default='dots', max_length=10)),
                ('form', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='branding',
                    to='forms.form'
                )),
            ],
            options={
                'db_table': 'fc_form_branding',
            },
        ),
    ]
