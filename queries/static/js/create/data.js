import elements from './elements.js';

const endpoints = {
    objects: elements.primaryObject.dataset.endpoint,
};

const dataFromApi = {};

export async function getObjectData(pk) {
    const dataId = `object_${pk}`;
    if (dataId in dataFromApi) {
        return dataFromApi[dataId];
    } else {
        const response = await fetch(endpoints.objects + pk);
        const json = await response.json();
        dataFromApi[dataId] = json;
        return json;
    }
}


export async function objectIncludeIds(objectId) {
    const objectData = await getObjectData(objectId);
    const filterFunc = includeFilter(objectData.name);
    return objectData.includes.filter(filterFunc).map(x => String(x.id));
}

function includeFilter(objectName) {
    switch (objectName) {
        case 'Alert':
            return (instance) => !(['stops', 'routes', 'trips', 'facilities'].includes(instance.name));
        case 'Line':
            return (instance) => !(['routes'].includes(instance.name));
        case 'Route':
            return (instance) => !(['route_patterns'].includes(instance.name));
        case 'Stop':
            return (instance) => !(['facilities', 'route', 'parent_station', 'child_stops', 'recommended_transfers'].includes(instance.name));
        default:
            return (instance) => true;
    }
}


const objectPaths = {
    Alert: '/alerts',
    Facility: '/facilities',
    Line: '/lines',
    Route: '/routes',
    RoutePattern: '/route_patterns',
    Stop: '/stops',
    Vehicle: '/vehicles',
}

const objectValuePaths = {
    Alert: {
        activity: 'data/{index}/attributes/informed_entity/{index}/activities/{index}',
        route_type: 'data/{index}/attributes/informed_entity/{index}/route_type',
        direction_id: 'data/{index}/attributes/informed_entity/{index}/direction_id',
        route: 'data/{index}/attributes/informed_entity/{index}/route',
        stop: 'data/{index}/attributes/informed_entity/{index}/stop',
        trip: 'data/{index}/attributes/informed_entity/{index}/trip',
        facility: 'data/{index}/attributes/informed_entity/{index}/facility',
        id: 'data/{index}/id',
        banner: 'data/{index}/attributes/banner',
        lifecycle: 'data/{index}/attributes/lifecycle',
        severity: 'data/{index}/attributes/severity',
    },
    Facility: {
        stop: 'data/{index}/relationships/stop/data/id',
        type: 'data/{index}/attributes/type',
    },
    Line: {
        id: 'data/{index}/id',
    },
    Route: {
        stop: 'data/{index}/relationships/stop/data/id',
        type: 'data/{index}/attributes/type',
        direction_id: 'data/{index}/attributes/direction_names/{index}',
        date: '',
        id: 'data/{index}/id',
    },
    RoutePattern: {
        id: 'data/{index}/id',
        route: 'data/{index}/relationships/route/data/id',
        direction_id: 'data/{index}/attributes/direction_names/{index}',
        stop: 'data/{index}/relationships/stop/data/id',
    },
    Stop: {
        date: '',
        direction_id: 'data/{index}/attributes/direction_names/{index}',
        latitude: '',
        longitude: '',
        radius: '',
        id: 'data/{index}/id',
        route_type: '',
        route: '',
        location_type: 'data/{index}/attributes/location_type',
    },
    Vehicle: {
        id: 'data/{index}/id',
        trip: 'data/{index}/relationships/trip/data/id',
        label: 'data/{index}/attributes/label',
        route: 'data/{index}/relationships/route/data/id',
        direction_id: 'data/{index}/attributes/direction_id',
        route_type: '',
    },
}

export async function getSetOfUniqueValues(objectName, valueName) {
    const values = new Set();
    if ((objectName in objectValuePaths) && (valueName in objectValuePaths[objectName])) {
        const valuePath = objectValuePaths[objectName][valueName].split('/');
        const response = await fetch('https://api-v3.mbta.com' + objectPaths[objectName]);
        const json = await response.json();
        findUniqueValues(json, valuePath, values);
    }
    return values;
}

function findUniqueValues(obj, path, outputSet) {
    const loc = path[0];
    path = path.slice(1);
    if (loc === '{index}') {
        if (Array.isArray(obj)) {
            if (path.length === 0) {
                obj.forEach(item => outputSet.add(item));
            } else {
                obj.forEach(item => findUniqueValues(item, path, outputSet));
            }
        }
    } else if (obj[loc]) {
        if (path.length === 0) {
            outputSet.add(obj[loc]);
        } else {
            findUniqueValues(obj[loc], path, outputSet);
        }
    }
}