from django.db import models
import json


class MbtaObject(models.Model):
    """
    Represents the objects accessible via the MBTA API.
    """
    path = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    can_specify_id = models.BooleanField(default=False)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class MbtaInclude(models.Model):
    """
    The additional objects or data that can be included
    in the results returned from the MBTA API.
    """
    name = models.CharField(max_length=50, unique=True)
    associated_object = models.ForeignKey(
        MbtaObject,
        related_name='associated_includes',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    included_by = models.ManyToManyField(
        MbtaObject,
        related_name='includes',
    )

    def __str__(self):
        return self.name


class MbtaFilter(models.Model):
    """
    The types of filters that can be attached to queries.
    """
    name = models.CharField(max_length=50)
    for_object = models.ForeignKey(
        MbtaObject,
        related_name='filters',
        related_query_name='filter',
        on_delete=models.CASCADE,
    )
    associated_object = models.ForeignKey(
        MbtaObject,
        related_name='associated_filters',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    def __str__(self):
        return f'[{self.for_object.name}] {self.name}'


class MbtaAttribute(models.Model):
    """
    The attributes or fields that each MBTA 'object' possesses.
    In queries, the attributes that are returned can be limited.
    """
    for_object = models.ForeignKey(
        MbtaObject,
        on_delete=models.CASCADE,
        related_name='attributes',
        related_query_name='attribute',
    )
    name = models.CharField(max_length=200)
    description = models.TextField()
    required = models.BooleanField()
    data_type = models.CharField(max_length=50)
    default = models.CharField(max_length=100, blank=True)
    example = models.CharField(max_length=100, blank=True)
    minimum = models.PositiveSmallIntegerField(blank=True, null=True)
    choices = models.CharField(max_length=200, blank=True)
    data_format = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f'[{self.for_object.name}] {self.name}'

    def set_choices(self, x):
        self.choices = json.dumps(x)

    def get_choices(self):
        return json.loads(self.choices)
