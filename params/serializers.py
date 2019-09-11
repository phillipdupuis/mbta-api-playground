from rest_framework import serializers
from .models import MbtaObject


class MbtaObjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = MbtaObject
        fields = '__all__'
