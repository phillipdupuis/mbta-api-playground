import * as params from './params.js';
import elements from './elements.js';


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


export async function getFilterChoices(filter) {

    const object = await params.objectProps(filter.for_object);

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

        const object = await params.objectProps(filter.associated_object);
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
