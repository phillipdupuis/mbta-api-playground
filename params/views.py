from rest_framework import generics
from .models import MbtaObject, MbtaInclude
from .serializers import MbtaObjectSerializer, MbtaObjectDetailSerializer, MbtaIncludeSerializer


class ObjectList(generics.ListAPIView):
    queryset = MbtaObject.objects.all()
    serializer_class = MbtaObjectSerializer


class ObjectDetail(generics.RetrieveAPIView):
    queryset = MbtaObject.objects.all()
    serializer_class = MbtaObjectDetailSerializer


class IncludeList(generics.ListAPIView):
    queryset = MbtaInclude.objects.all()
    serializer_class = MbtaIncludeSerializer
