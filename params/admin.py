from django.contrib import admin
from django.forms import TextInput
from django.db import models
from .models import MbtaObject, MbtaInclude, MbtaFilter, MbtaAttribute


class NoAddDeleteMixin(object):
    """ Mixin which disables adding or removing instances"""

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class NoEditMixin(object):
    """ Mixin which disables editing any fields """

    def has_change_permission(self, request, obj=None):
        return False


class IncludeInline(NoAddDeleteMixin, NoEditMixin, admin.TabularInline):
    model = MbtaInclude.included_by.through
    verbose_name = 'Include'
    verbose_name_plural = 'Includes'
    extra = 0


class FilterInline(NoAddDeleteMixin, admin.TabularInline):
    model = MbtaFilter
    fk_name = 'for_object'
    verbose_name = 'Filter'
    verbose_name_plural = 'Filters'
    extra = 0
    readonly_fields = ('name', 'associated_object')
    formfield_overrides = {
        models.CharField: {'widget': TextInput(attrs={'size': '80'})},
    }


class AttributeInline(NoAddDeleteMixin, admin.StackedInline):
    model = MbtaAttribute
    verbose_name = 'Attribute'
    verbose_name_plural = 'Attributes'
    extra = 0
    formfield_overrides = {
        models.CharField: {'widget': TextInput(attrs={'size': '120'})},
    }


@admin.register(MbtaObject)
class MbtaObjectAdmin(NoAddDeleteMixin, admin.ModelAdmin):
    list_display = ('name', 'active')
    readonly_fields = ('name', 'path', 'description', 'can_specify_id', 'requires_filters')
    inlines = [IncludeInline, FilterInline, AttributeInline]
