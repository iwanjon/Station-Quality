
from db_manager.form import UsersAdminForm
from django.contrib import admin
from django.apps import apps
import bcrypt


# Get all models from our app
app = apps.get_app_config('db_manager')

# # Register them all in the admin panel automatically
# for model_name, model in app.models.items():
    
#     # 1. Dynamically get all field names for the current model
#     # model._meta.fields gives you the actual database columns
#     all_fields = [field.name for field in model._meta.fields]
    
#     # 2. Create a custom ModelAdmin class on the fly
#     class DynamicAdmin(admin.ModelAdmin):
#         list_display = all_fields
#         list_filter = all_fields
#         search_fields = all_fields # Bonus: makes all fields searchable too!

#     # 3. Register the model with the new DynamicAdmin class
#     try:
#         admin.site.register(model, DynamicAdmin)
#     except admin.sites.AlreadyRegistered:
#         pass

from .models import Users
from django.contrib import admin
from .models import (
    Availability, Jaringan, LatencyHistory, MetadataXmlPath, Migrations,
    Permissions, Provinsi, RefreshTokens, RolePermissions, Roles,
    Stasiun, StasiunHistory, Upt, Users
)

@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ('availability_id', 'stasiun', 'tanggal', 'nilai_availability')
    list_filter = ('tanggal',)
    search_fields = ('stasiun__kode_stasiun',) # Assuming Stasiun has a 'kode_stasiun' field
    date_hierarchy = 'tanggal'

@admin.register(Jaringan)
class JaringanAdmin(admin.ModelAdmin):
    list_display = ('jaringan_id', 'nama_jaringan')
    search_fields = ('nama_jaringan',)

@admin.register(LatencyHistory)
class LatencyHistoryAdmin(admin.ModelAdmin):
    # Truncated list_display to avoid horizontal scrolling overload, add more if needed
    list_display = ('id', 'sta', 'ipaddr', 'net', 'time_from_api', 'recorded_at', 'provin')
    list_filter = ('net', 'provin', 'time_from_api', 'recorded_at')
    search_fields = ('sta', 'ipaddr', 'location', 'uptbmkg')
    date_hierarchy = 'recorded_at'

@admin.register(MetadataXmlPath)
class MetadataXmlPathAdmin(admin.ModelAdmin):
    list_display = ('path', 'updated_at')
    list_filter = ('updated_at',)
    search_fields = ('path',)

@admin.register(Migrations)
class MigrationsAdmin(admin.ModelAdmin):
    list_display = ('filename', 'executed_at')
    list_filter = ('executed_at',)
    search_fields = ('filename',)

@admin.register(Permissions)
class PermissionsAdmin(admin.ModelAdmin):
    list_display = ('permission_id', 'permission_name', 'description')
    search_fields = ('permission_name', 'description')

@admin.register(Provinsi)
class ProvinsiAdmin(admin.ModelAdmin):
    list_display = ('provinsi_id', 'nama_provinsi')
    search_fields = ('nama_provinsi',)

@admin.register(RefreshTokens)
class RefreshTokensAdmin(admin.ModelAdmin):
    list_display = ('token_id', 'user', 'expires_at', 'created_at')
    list_filter = ('expires_at', 'created_at')
    search_fields = ('token', 'user__username')

@admin.register(RolePermissions)
class RolePermissionsAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission')
    list_filter = ('role', 'permission')

@admin.register(Roles)
class RolesAdmin(admin.ModelAdmin):
    list_display = ('role_id', 'role_name', 'description')
    search_fields = ('role_name', 'description')

@admin.register(Stasiun)
class StasiunAdmin(admin.ModelAdmin):
    list_display = ('stasiun_id', 'kode_stasiun', 'net', 'provinsi', 'upt', 'get_jaringan_name', 'status', 'tahun_instalasi')
    list_filter = ('status', 'net', 'provinsi', 'jaringan', 'upt', 'tahun_instalasi', 'prioritas')
    search_fields = ('kode_stasiun', 'lokasi', 'keterangan', 'accelerometer')

# Add this custom method inside the class
    def get_jaringan_name(self, obj):
        if obj.jaringan: # Check if a relation actually exists to prevent errors
            return obj.jaringan.nama_jaringan
        return "-" # What to display if it is empty
    
    # This names the column header in the admin table
    get_jaringan_name.short_description = 'Nama Jaringan'

@admin.register(StasiunHistory)
class StasiunHistoryAdmin(admin.ModelAdmin):
    list_display = ('history_id', 'stasiun', 'status', 'channel', 'sensor_name', 'digitizer_name', 'start_date', 'end_date')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('stasiun__kode_stasiun', 'sensor_name', 'digitizer_name', 'channel')
    date_hierarchy = 'start_date'

@admin.register(Upt)
class UptAdmin(admin.ModelAdmin):
    list_display = ('upt_id', 'nama_upt', 'status')
    list_filter = ('status',)
    search_fields = ('nama_upt',)





@admin.register(Users)
class UsersAdmin(admin.ModelAdmin):
    form = UsersAdminForm

    list_display = ('user_id', 'username', 'email', 'role', 'upt', 'is_active', 'status')
    list_filter = ('is_active', 'status', 'role', 'created_at')
    search_fields = ('username', 'email')

    # def save_model(self, request, obj, form, change):
    #         # 1. Check if a password exists in the form
    #         if obj.password_hash:
    #             # 2. Check if it's NOT already a bcrypt hash. 
    #             # Bcrypt hashes always start with $2a$, $2b$, or $2y$. 
    #             # This prevents re-hashing if you just edit a user's email.
    #             if not obj.password_hash.startswith('$2'):
                    
    #                 # 3. Hash it to match Express (Cost factor 10)
    #                 # We encode to bytes, hash, and decode back to string for the database
    #                 salt = bcrypt.gensalt(10)
    #                 hashed_password = bcrypt.hashpw(obj.password_hash.encode('utf-8'), salt)
    #                 obj.password_hash = hashed_password.decode('utf-8')
            
    #         # 4. Save the model normally
    #         super().save_model(request, obj, form, change)
    def save_model(self, request, obj, form, change):
            if obj.password_hash and not obj.password_hash.startswith('$2'):
                salt = bcrypt.gensalt(10)
                hashed_password = bcrypt.hashpw(obj.password_hash.encode('utf-8'), salt)
                obj.password_hash = hashed_password.decode('utf-8')
            
            super().save_model(request, obj, form, change)