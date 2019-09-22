import elements from './elements.js';

const endpoints = {
    objects: elements.primaryObject.dataset.endpoint
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

// Quick way to hide include options that aren't working
const hiddenIncludes = {
    Alert: ['stops', 'routes', 'trips', 'facilities'],
    Line: ['routes'],
    Route: ['route_patterns'],
    Stop: ['facilities', 'route', 'parent_station', 'child_stops', 'recommended_transfers'],
};

export async function objectIncludes(pk) {
    const object = await getObjectData(pk);
    const hidden = hiddenIncludes[object.name] || [];
    return object.includes.filter(x => !hidden.includes(x.name));
}


const hiddenAttributes = {};

export async function objectAttributes(pk) {
    const object = await getObjectData(pk);
    const hidden = hiddenAttributes[object.name] || [];
    return object.attributes.filter(x => !hidden.includes(x.name));
}


const hiddenFilters = {
    Alert: ['banner', 'datetime'],
    Route: ['date', 'stop', 'direction_id'],
    RoutePattern: ['direction_id', 'stop'],
    Stop: ['date', 'direction_id', 'latitude', 'longitude', 'radius', 'route', 'route_type'],
    Vehicle: ['direction_id', 'route_type'],
};

export async function objectFilters(pk) {
    const object = await getObjectData(pk);
    const hidden = hiddenFilters[object.name] || [];
    const sortFunction = (a, b) => (a.name === 'id') ? -1 : a.name.localeCompare(b.name);
    return object.filters.filter(x => !hidden.includes(x.name)).sort(sortFunction);
}


const mbtaApiObjectPaths = {
    Alert: 'https://api-v3.mbta.com/alerts',
    Facility: 'https://api-v3.mbta.com/facilities',
    Line: 'https://api-v3.mbta.com/lines',
    Route: 'https://api-v3.mbta.com/routes',
    RoutePattern: 'https://api-v3.mbta.com/route_patterns',
    Stop: 'https://api-v3.mbta.com/stops',
    Vehicle: 'https://api-v3.mbta.com/vehicles',
}


const objectNameAttributes = {
    Alert: 'service_effect',
    Facility: 'short_name',
    Line: 'long_name',
    Route: 'long_name',
    RoutePattern: 'name',
    Stop: 'name',
    Vehicle: undefined,
}


export async function getFilterChoices(objectId, filterId) {

    const object = await getObjectData(objectId);
    const filter = object.filters.find(x => x.id == filterId);

    if ((object.name in mbtaApiObjectPaths) && (filter.json_path)) {
        const response = await fetch(mbtaApiObjectPaths[object.name]);
        const json = await response.json();
        const internalValues = getUniqueValues(json, filter.json_path);
        const choices = await mapFilterValuesToNames(filter, internalValues);
        // sort the choices
        const compareFunction = getFilterCompareFunction(filter);
        return choices.sort(compareFunction);
    } else {
        return [];
    }
}


function getFilterCompareFunction(filter) {
    if (['severity'].includes(filter.name)) {
        return (a, b) => Number(a[0]) - Number(b[0]);
    } else {
        return (a, b) => String(a[1]).localeCompare(String(b[1]));
    }
}


const gtfsFieldChoiceMaps = {
    route_type: {
        '0': 'Tram/Streetcar/Light rail',
        '1': 'Subway',
        '2': 'Rail',
        '3': 'Bus',
        '4': 'Ferry',
        '5': 'Cable car',
        '6': 'Gondola',
        '7': 'Funicular',
    },
    location_type: {
        '0': 'Stop',
        '1': 'Station',
        '2': 'Entrance/Exit',
        '3': 'Generic Node',
        '4': 'Boarding Area',
    }
}


async function mapFilterValuesToNames(filter, values) {

    if (filter.associated_object) {

        const object = await getObjectData(filter.associated_object);
        const nameAttribute = objectNameAttributes[object.name];

        if (nameAttribute && mbtaApiObjectPaths[object.name]) {
            // build a request for ONLY getting the name attributes.
            // filtering based on ID has to be done client-side (seems to break sometimes if it's a URL parameter)
            const url = new URL(mbtaApiObjectPaths[object.name]);
            url.searchParams.append(`fields[${object.name.toLowerCase()}]`, nameAttribute);

            const inValues = (entry) => values.includes(entry.id);
            const formatAsValueNamePair = (entry) => [entry.id, `${entry.attributes[nameAttribute]} [${entry.id}]`];

            const response = await fetch(url);
            const json = await response.json();
            return json['data'].filter(inValues).map(formatAsValueNamePair);
        }
    } else if (filter.name in gtfsFieldChoiceMaps) {
        const map = gtfsFieldChoiceMaps[filter.name];
        return values.map(v => [v, `${v} - ${map[v]}`]);
    }
    // if we reach this point, just show the internal value 
    return values.map(v => [v, v]);
}


function getAllValues(data, path) {
    const values = [];
    const successFunction = (v) => values.push(v);
    extractValues(data, path.split('/'), successFunction);
    return values;
}


function getUniqueValues(data, path) {
    const values = new Set();
    const successFunction = (v) => values.add(v);
    extractValues(data, path.split('/'), successFunction);
    return Array.from(values);
}


function extractValues(data, path, successFunction) {
    const dir = path[0];
    path = path.slice(1);
    if (dir === '{index}') {
        // {index} means the data should be an array.
        // if the path is complete, take all the items in this array as results.
        // else, keep parsing.
        if (Array.isArray(data)) {
            if (path.length === 0) {
                data.forEach(x => successFunction(x));
            } else {
                data.forEach(x => extractValues(x, path, successFunction));
            }
        }
    } else {
        // else, dir should be a property of the data. Exit if it's not.
        if (data[dir]) {
            if (path.length === 0) {
                successFunction(data[dir]);
            } else {
                extractValues(data[dir], path, successFunction);
            }
        }
    }
}


// const objectValuePaths = {
//     Alert: {
//         activity: 'data/{index}/attributes/informed_entity/{index}/activities/{index}',
//         route_type: 'data/{index}/attributes/informed_entity/{index}/route_type',
//         direction_id: 'data/{index}/attributes/informed_entity/{index}/direction_id',
//         route: 'data/{index}/attributes/informed_entity/{index}/route',
//         stop: 'data/{index}/attributes/informed_entity/{index}/stop',
//         trip: 'data/{index}/attributes/informed_entity/{index}/trip',
//         facility: 'data/{index}/attributes/informed_entity/{index}/facility',
//         id: 'data/{index}/id',
//         banner: 'data/{index}/attributes/banner',
//         lifecycle: 'data/{index}/attributes/lifecycle',
//         severity: 'data/{index}/attributes/severity',
//     },
//     Facility: {
//         stop: 'data/{index}/relationships/stop/data/id',
//         type: 'data/{index}/attributes/type',
//     },
//     Line: {
//         id: 'data/{index}/id',
//     },
//     Route: {
//         stop: 'data/{index}/relationships/stop/data/id',
//         type: 'data/{index}/attributes/type',
//         direction_id: 'data/{index}/attributes/direction_names/{index}',
//         date: '',
//         id: 'data/{index}/id',
//     },
//     RoutePattern: {
//         id: 'data/{index}/id',
//         route: 'data/{index}/relationships/route/data/id',
//         direction_id: 'data/{index}/attributes/direction_names/{index}',
//         stop: 'data/{index}/relationships/stop/data/id',
//     },
//     Stop: {
//         date: '',
//         direction_id: 'data/{index}/attributes/direction_names/{index}',
//         latitude: '',
//         longitude: '',
//         radius: '',
//         id: 'data/{index}/id',
//         route_type: '',
//         route: '',
//         location_type: 'data/{index}/attributes/location_type',
//     },
//     Vehicle: {
//         id: 'data/{index}/id',
//         trip: 'data/{index}/relationships/trip/data/id',
//         label: 'data/{index}/attributes/label',
//         route: 'data/{index}/relationships/route/data/id',
//         direction_id: 'data/{index}/attributes/direction_id',
//         route_type: '',
//     },
// }
