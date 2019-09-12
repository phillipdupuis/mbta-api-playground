from rest_framework import serializers
from .models import MbtaObject, MbtaInclude, MbtaFilter, MbtaAttribute


class MbtaObjectSerializer(serializers.ModelSerializer):

    class Meta:
        model = MbtaObject
        fields = '__all__'


class MbtaIncludeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MbtaInclude
        fields = '__all__'


class MbtaFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = MbtaFilter
        fields = '__all__'


class MbtaAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MbtaAttribute
        fields = '__all__'


class MbtaObjectDetailSerializer(serializers.ModelSerializer):

    includes = MbtaIncludeSerializer(many=True, read_only=True)
    filters = MbtaFilterSerializer(many=True, read_only=True)
    attributes = MbtaAttributeSerializer(many=True, read_only=True)

    class Meta:
        model = MbtaObject
        fields = '__all__'
