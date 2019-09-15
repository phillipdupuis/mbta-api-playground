import requests
from .models import MbtaObject, MbtaInclude, MbtaFilter, MbtaAttribute


def main():
    print('Making sure the database is initialized...')
    # for x in (MbtaObject, MbtaInclude, MbtaFilter, MbtaAttribute):
    #     x.objects.all().delete()
    init_MbtaObject()
    init_MbtaInclude()
    init_MbtaFilter()
    init_MbtaAttribute()


def get_api_doc() -> dict:
    return requests.get('https://api-v3.mbta.com/docs/swagger/swagger.json').json()


def init_MbtaObject() -> None:
    if MbtaObject.objects.all().exists():
        pass
    else:
        api_doc = get_api_doc()
        paths = [p for p in api_doc['paths'].keys() if not p.endswith(r'{id}')]
        for path in paths:
            create_MbtaObject(path, api_doc)


def create_MbtaObject(path, api_doc) -> MbtaObject:
    name = api_doc['paths'][path]['get']['tags'][0]
    description = api_doc['paths'][path]['get']['description']
    can_specify_id = True if (path + r'/{id}') in api_doc['paths'] else False
    requires_filters = object_requires_filters(name)
    return MbtaObject.objects.create(
        path=path,
        name=name,
        description=description,
        can_specify_id=can_specify_id,
        requires_filters=requires_filters,
    )


def object_requires_filters(name):
    if name in ('LiveFacility', 'Prediction', 'Schedule', 'Service', 'Shape', 'Trip'):
        return True
    else:
        return False


def init_MbtaInclude():
    if MbtaInclude.objects.all().exists():
        pass
    else:
        api_doc = get_api_doc()
        for _object_ in MbtaObject.objects.all():
            for name in get_MbtaObject_includes(_object_, api_doc):
                _include_ = create_MbtaInclude(name)
                _include_.included_by.add(_object_)


def get_MbtaObject_includes(_object_: MbtaObject, api_doc: dict) -> list:
    """
    Find the "include" parameter for an object and extract the include
    options from the description.
    """
    for param in api_doc['paths'][_object_.path]['get']['parameters']:
        if param['name'] == 'include':
            bulleted_list = param['description'].split('\n\n')[1]
            includes = [x.strip(' *`') for x in bulleted_list.split('\n*')]
            return includes
    else:
        return []


def create_MbtaInclude(name: str) -> MbtaInclude:
    try:
        return MbtaInclude.objects.get(name=name)
    except MbtaInclude.DoesNotExist:
        associated_object = get_associated_object(name)
        return MbtaInclude.objects.create(name=name, associated_object=associated_object)


def get_associated_object(identifier: str) -> MbtaObject:
    """
    Takes an identifier and determines what MbtaObject it represents (if any).
    For example, 'stop', 'child_stops', and 'parent_station' will all result
    in the 'Stop' MbtaObject being returned.
    """
    def not_describing_hierarchy(word: str) -> bool:
        return word not in ('parent', 'child')

    def replace_synonyms(word: str) -> str:
        synonyms = {'station': 'stop'}
        return word if word not in synonyms else synonyms[word]

    def make_singular(word: str) -> str:
        if word.endswith('ies'):
            return word[:-3] + 'y'
        elif word.endswith('s'):
            return word[:-1]
        else:
            return word

    words = identifier.split('_')
    words = filter(not_describing_hierarchy, words)
    words = map(replace_synonyms, words)
    name = ''.join([word.capitalize() for word in words])
    name = make_singular(name)
    try:
        return MbtaObject.objects.get(name=name)
    except MbtaObject.DoesNotExist:
        return None


def init_MbtaFilter():
    if MbtaFilter.objects.all().exists():
        pass
    else:
        api_doc = get_api_doc()
        for _object_ in MbtaObject.objects.all():
            for name in get_MbtaObject_filters(_object_, api_doc):
                create_MbtaFilter(_object_, name)


def get_MbtaObject_filters(_object_: MbtaObject, api_doc: dict) -> list:
    filters = []
    for param in api_doc['paths'][_object_.path]['get']['parameters']:
        if param['name'].startswith('filter['):
            filters.append(param['name'][len('filter['):-1])
    return filters


def create_MbtaFilter(for_object: MbtaObject, name: str) -> MbtaFilter:
    if name == 'id':
        associated_object = for_object
    else:
        associated_object = get_associated_object(name)
    return MbtaFilter.objects.create(
        for_object=for_object,
        name=name,
        associated_object=associated_object
    )


def init_MbtaAttribute():
    if MbtaAttribute.objects.all().exists():
        pass
    else:
        api_doc = get_api_doc()
        for _object_ in MbtaObject.objects.all():
            for name, properties in get_MbtaObject_attributes(_object_, api_doc).items():
                create_MbtaAttribute(_object_, name, properties)


def get_MbtaObject_attributes(_object_: MbtaObject, api_doc: dict) -> dict:
    attributes = {}
    resource_definition = api_doc['definitions'][_object_.name + 'Resource']
    for name, properties in resource_definition['properties']['attributes']['properties'].items():
        attributes[name] = properties
    return attributes


def create_MbtaAttribute(for_object: MbtaObject, name: str, properties: dict) -> MbtaAttribute:
    def get_prop(name, default=None):
        try:
            return properties[name]
        except KeyError:
            return default
    return MbtaAttribute.objects.create(
        name=name,
        for_object=for_object,
        description=get_prop('description', ''),
        required=get_prop('required', False),
        data_type=get_prop('type', ''),
        default=get_prop('default', ''),
        example=get_prop('x-example', ''),
        minimum=get_prop('minimum', None),
        choices=get_prop('enum', ''),
        data_format=get_prop('format', ''),
    )
