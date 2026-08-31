from rest_framework.permissions import BasePermission, SAFE_METHODS


FULL_ACCESS_ROLES = {'talent_admin'}
SCHOOL_ROLES = {'head_teacher', 'sport_teacher'}


def has_full_access(user):
    return user.is_superuser or user.role in FULL_ACCESS_ROLES


def scope_queryset(queryset, user, scope_paths):
    """Limit a queryset using the user's assigned geographic scope."""
    if not user or not user.is_authenticated:
        return queryset
    if has_full_access(user):
        return queryset

    if user.role == 'student':
        return queryset.filter(**{scope_paths['student']: user.student_id}) if scope_paths.get('student') else queryset.none()

    if user.role in SCHOOL_ROLES:
        return queryset.filter(**{scope_paths['school']: user.school_id}) if scope_paths.get('school') else queryset.none()

    scope_map = {'country': user.country_id, 'zone': user.zone_id, 'region': user.region_id, 'district': user.district_id, 'ward': user.ward_id}
    if user.ward_id:
        ward = user.ward
        scope_map.update({'district': ward.district_id, 'region': ward.district.region_id, 'zone': ward.district.region.zone_id, 'country': ward.district.region.zone.country_id})
    elif user.district_id:
        district = user.district
        scope_map.update({'region': district.region_id, 'zone': district.region.zone_id, 'country': district.region.zone.country_id})
    elif user.region_id:
        region = user.region
        scope_map.update({'zone': region.zone_id, 'country': region.zone.country_id})
    elif user.zone_id:
        scope_map['country'] = user.zone.country_id
    role_scope = {
        'region_manager': 'region',
        'zone_manager': 'zone',
        'district_manager': 'district',
        'ward_manager': 'ward',
    }.get(user.role)
    scope_levels = {'region': ('region', 'zone', 'country'), 'zone': ('zone', 'country'), 'district': ('district', 'region', 'zone', 'country'), 'ward': ('ward', 'district', 'region', 'zone', 'country')}
    if role_scope:
        for level in scope_levels[role_scope]:
            if scope_map[level] and scope_paths.get(level):
                return queryset.filter(**{scope_paths[level]: scope_map[level]})
    return queryset.none()


class ScopedQuerysetMixin:
    scope_paths = {}

    def get_queryset(self):
        queryset = super().get_queryset()
        return scope_queryset(queryset, self.request.user, self.scope_paths)


class AuthenticatedReadOnly(BasePermission):
    """Allow authenticated reads; reserve writes for privileged staff."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return has_full_access(request.user) or request.user.role in {
            'talent_admin',
            'head_teacher',
            'sport_teacher',
            'district_manager',
            'ward_manager',
        }


class ConfigurationPermission(BasePermission):
    """Allow authenticated reads; reserve configuration writes for administrators."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return has_full_access(request.user)


class PublicSchoolRegistrationPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return getattr(view, 'public_registration', False) and view.action == 'create'


class StudentDataPermission(BasePermission):
    """Students may read only their own data; staff may manage student data."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_superuser or request.user.role in {
            'talent_admin',
            'head_teacher',
            'sport_teacher',
            'district_manager',
            'ward_manager',
        }

    def has_object_permission(self, request, view, obj):
        if has_full_access(request.user) or request.user.role != 'student':
            return True
        return getattr(obj, 'id', None) == request.user.student_id


class SubmissionPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return has_full_access(request.user) or request.user.role in {
            'talent_admin', 'head_teacher', 'sport_teacher', 'student',
        }

    def has_object_permission(self, request, view, obj):
        if has_full_access(request.user) or request.user.role != 'student':
            return True
        return obj.student_id == request.user.student_id

class IsSportTeacher(BasePermission):
    """Allow only sport teachers."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'sport_teacher'