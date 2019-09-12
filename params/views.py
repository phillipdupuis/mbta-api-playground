from django.shortcuts import render
from rest_framework import generics
from .models import MbtaObject
from .serializers import MbtaObjectSerializer, MbtaObjectDetailSerializer


class ObjectList(generics.ListAPIView):
    queryset = MbtaObject.objects.all()
    serializer_class = MbtaObjectSerializer


class ObjectDetail(generics.RetrieveAPIView):
    queryset = MbtaObject.objects.all()
    serializer_class = MbtaObjectDetailSerializer
