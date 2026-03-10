# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.IntegerField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.IntegerField()
    is_active = models.IntegerField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class Availability(models.Model):
    availability_id = models.AutoField(primary_key=True)
    stasiun = models.ForeignKey('Stasiun', models.DO_NOTHING, blank=True, null=True)
    tanggal = models.DateTimeField(blank=True, null=True)
    nilai_availability = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'availability'


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class Jaringan(models.Model):
    jaringan_id = models.AutoField(primary_key=True)
    nama_jaringan = models.TextField()

    class Meta:
        managed = False
        db_table = 'jaringan'


class LatencyHistory(models.Model):
    id = models.BigAutoField(primary_key=True)
    sta = models.CharField(max_length=10)
    ipaddr = models.CharField(max_length=45, blank=True, null=True)
    net = models.CharField(max_length=10, blank=True, null=True)
    time_from_api = models.DateTimeField(blank=True, null=True)
    latency1 = models.IntegerField(blank=True, null=True)
    latency2 = models.IntegerField(blank=True, null=True)
    latency3 = models.IntegerField(blank=True, null=True)
    latency4 = models.IntegerField(blank=True, null=True)
    latency5 = models.IntegerField(blank=True, null=True)
    latency6 = models.IntegerField(blank=True, null=True)
    ch1 = models.CharField(max_length=10, blank=True, null=True)
    ch2 = models.CharField(max_length=10, blank=True, null=True)
    ch3 = models.CharField(max_length=10, blank=True, null=True)
    ch4 = models.CharField(max_length=10, blank=True, null=True)
    ch5 = models.CharField(max_length=10, blank=True, null=True)
    ch6 = models.CharField(max_length=10, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    provin = models.CharField(max_length=50, blank=True, null=True)
    uptbmkg = models.CharField(max_length=100, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    recorded_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'latency_history'


class MetadataXmlPath(models.Model):
    path = models.TextField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'metadata_xml_path'


class Migrations(models.Model):
    filename = models.CharField(unique=True, max_length=255)
    executed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'migrations'


class Permissions(models.Model):
    permission_id = models.AutoField(primary_key=True)
    permission_name = models.CharField(unique=True, max_length=50)
    description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'permissions'


class Provinsi(models.Model):
    provinsi_id = models.AutoField(primary_key=True)
    nama_provinsi = models.CharField(max_length=32)

    class Meta:
        managed = False
        db_table = 'provinsi'


class RefreshTokens(models.Model):
    token_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING)
    token = models.CharField(unique=True, max_length=255)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'refresh_tokens'


class RolePermissions(models.Model):
    role = models.ForeignKey('Roles', models.DO_NOTHING)
    permission = models.ForeignKey(Permissions, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'role_permissions'


class Roles(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(unique=True, max_length=50)
    description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'roles'


class Seeders(models.Model):
    filename = models.CharField(unique=True, max_length=255)
    executed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'seeders'


class Stasiun(models.Model):
    stasiun_id = models.AutoField(primary_key=True)
    net = models.CharField(max_length=2, blank=True, null=True)
    kode_stasiun = models.CharField(unique=True, max_length=8)
    lintang = models.FloatField(blank=True, null=True)
    bujur = models.FloatField(blank=True, null=True)
    elevasi = models.FloatField(blank=True, null=True)
    lokasi = models.TextField(blank=True, null=True)
    provinsi = models.ForeignKey(Provinsi, models.DO_NOTHING, blank=True, null=True)
    upt = models.ForeignKey('Upt', models.DO_NOTHING, blank=True, null=True)
    status = models.CharField(max_length=10, blank=True, null=True)
    tahun_instalasi = models.IntegerField(blank=True, null=True)
    jaringan = models.ForeignKey(Jaringan, models.DO_NOTHING, blank=True, null=True)
    prioritas = models.CharField(max_length=5, blank=True, null=True)
    keterangan = models.TextField(blank=True, null=True)
    accelerometer = models.CharField(max_length=20, blank=True, null=True)
    digitizer_komunikasi = models.TextField(blank=True, null=True)
    tipe_shelter = models.CharField(max_length=10, blank=True, null=True)
    lokasi_shelter = models.CharField(max_length=30, blank=True, null=True)
    penjaga_shelter = models.CharField(max_length=10, blank=True, null=True)
    kondisi_shelter = models.TextField(blank=True, null=True)
    assets_shelter = models.TextField(blank=True, null=True)
    access_shelter = models.TextField(blank=True, null=True)
    photo_shelter = models.TextField(blank=True, null=True)
    penggantian_terakhir_alat = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'stasiun'


class StasiunHistory(models.Model):
    history_id = models.AutoField(primary_key=True)
    stasiun = models.ForeignKey(Stasiun, models.DO_NOTHING, blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    channel = models.CharField(max_length=10, blank=True, null=True)
    sensor_name = models.TextField(blank=True, null=True)
    digitizer_name = models.TextField(blank=True, null=True)
    total_gain = models.BigIntegerField(blank=True, null=True)
    input_unit = models.CharField(max_length=10, blank=True, null=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    elevation = models.FloatField(blank=True, null=True)
    sampling_rate = models.FloatField(blank=True, null=True)
    paz = models.JSONField(blank=True, null=True)
    response_path = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'stasiun_history'


class Upt(models.Model):
    upt_id = models.AutoField(primary_key=True)
    nama_upt = models.TextField()
    status = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'upt'


class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(unique=True, max_length=50)
    email = models.CharField(unique=True, max_length=100)
    password_hash = models.CharField(max_length=255)
    role = models.ForeignKey(Roles, models.DO_NOTHING, blank=True, null=True)
    upt = models.ForeignKey(Upt, models.DO_NOTHING, blank=True, null=True)
    is_active = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'
