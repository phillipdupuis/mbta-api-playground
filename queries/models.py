from django.db import models
from django.conf import settings
from django.utils import timezone
from typing import List
from collections import OrderedDict
import requests
from params.models import MbtaObject, MbtaInclude, MbtaAttribute, MbtaFilter


class Query(models.Model):
    """
    User-created.
    """
    primary_object = models.ForeignKey(
        MbtaObject,
        on_delete=models.CASCADE,
        verbose_name='Object',
        related_name='queries',
    )
    includes = models.ManyToManyField(
        MbtaInclude,
        verbose_name='Include',
        related_name='included_in_queries',
        blank=True,
    )
    attributes = models.ManyToManyField(
        MbtaAttribute,
        verbose_name='Attributes',
        related_name='included_in_queries',
    )
    url = models.CharField(max_length=500, default='')

    def __str__(self):
        return self.url

    def all_objects(self) -> List[MbtaObject]:
        objects = [self.primary_object]
        for include in self.includes.filter(associated_object__isnull=False):
            objects.append(include.associated_object)
        return objects

    def get_response(self) -> requests.Response:
        response = Request(query=self).get()
        self.url = response.url
        self.save()
        return response


class QueryFilter(models.Model):
    query = models.ForeignKey(
        Query,
        on_delete=models.CASCADE,
        related_name='filters',
        related_query_name='filter',
    )
    on_attribute = models.ForeignKey(
        MbtaFilter,
        on_delete=models.CASCADE,
        related_name='query_instances',
        related_query_name='query_instance',
    )
    values = models.CharField(max_length=200)

    def __str__(self):
        return f'{self.on_attribute} = {self.values}'


class Request(models.Model):
    query = models.ForeignKey(
        Query,
        on_delete=models.CASCADE,
        related_name='requests',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    datetime = models.DateTimeField('date/time', default=timezone.now)
    response_status_code = models.PositiveSmallIntegerField('status code', blank=True, null=True)

    def __str__(self):
        return f'{self.query} -> {self.response_status_code}'

    def url(self) -> str:
        return requests.compat.urljoin('https://api-v3.mbta.com', self.query.primary_object.path)

    def headers(self) -> dict:
        return {'X-API-Key': 'e2950b1a1b674c69b331114062c458e1'}

    def params(self) -> OrderedDict:
        params = OrderedDict()
        if self.query.includes.all().exists():
            params['include'] = ','.join((x.name for x in self.query.includes.all()))
        return params

    def get(self) -> requests.Response:
        """ Converts a query into a request and then gets the response """
        response = requests.get(self.url(), headers=self.headers(), params=self.params())
        self.datetime = timezone.now()
        self.response_status_code = response.status_code
        return response
