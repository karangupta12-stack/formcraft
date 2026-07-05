import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('forms', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Response',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data_json', models.JSONField(default=dict)),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('fingerprint', models.CharField(blank=True, default='', max_length=64)),
                ('email', models.EmailField(blank=True, default='')),
                ('time_to_complete', models.PositiveIntegerField(default=0)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('form', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='responses',
                    to='forms.form'
                )),
            ],
            options={
                'db_table': 'fc_responses',
                'ordering': ['-submitted_at'],
            },
        ),
        migrations.CreateModel(
            name='UploadedFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('field_id', models.CharField(max_length=100)),
                ('file', models.FileField(upload_to='form_uploads/')),
                ('filename', models.CharField(max_length=255)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('form', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='uploaded_files',
                    to='forms.form'
                )),
                ('response', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='files',
                    to='responses.response'
                )),
            ],
            options={
                'db_table': 'fc_uploaded_files',
            },
        ),
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(
                    choices=[('started', 'Started'), ('completed', 'Completed'), ('abandoned', 'Abandoned')],
                    default='started', max_length=12
                )),
                ('last_step', models.PositiveSmallIntegerField(default=0)),
                ('last_field_id', models.CharField(blank=True, default='', max_length=64)),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('form', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='sessions',
                    to='forms.form'
                )),
            ],
            options={
                'db_table': 'fc_sessions',
            },
        ),
    ]
