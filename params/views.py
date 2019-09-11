from django.shortcuts import render
from rest_framework import generics
from .models import MbtaObject
from .serializers import MbtaObjectSerializer


class ObjectList(generics.ListAPIView):
    queryset = MbtaObject.objects.all()
    serializer_class = MbtaObjectSerializer
