import Params from './params.js';

const mbtaApiObjectPaths = {
  Alert: 'https://api-v3.mbta.com/alerts',
  Facility: 'https://api-v3.mbta.com/facilities',
  Line: 'https://api-v3.mbta.com/lines',
  Route: 'https://api-v3.mbta.com/routes',
  RoutePattern: 'https://api-v3.mbta.com/route_patterns',
  Stop: 'https://api-v3.mbta.com/stops',
  Vehicle: 'https://api-v3.mbta.com/vehicles',
};

const objectNameAttributes = {
  Alert: 'service_effect',
  Facility: 'short_name',
  Line: 'long_name',
  Route: 'long_name',
  RoutePattern: 'name',
  Stop: 'name',
  Vehicle: undefined,
};

/**
 * Helper for converting numeric choices to human-readable values.
 * Useful only for GTFS fields which have a standard limited set of possible values.
 * More information can be found here: https://developers.google.com/transit/gtfs/reference
 */
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
};

/**
 * Most filters will have the results sorted in regular string-sorting order,
 * but there are exceptions. This function handles figuring it out.
 */
function getFilterSortFunction(filter) {
  if (['severity'].includes(filter.name)) {
    return (a, b) => Number(a[0]) - Number(b[0]);
  } else {
    return (a, b) => String(a[1]).localeCompare(String(b[1]));
  }
}

/**
 * Given a filter and an array of INTERNAL values, return an array in which
 * each internal value is paired with an external representation.
 */
async function mapFilterValuesToNames(filter, values) {

  if (filter.associated_object) {

    const object = await Params.objectProps(filter.associated_object);
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

/**
 * Given JSON data for a series of objects and the path to a particular attribute,
 * go through those objects and compile an array of ALL values for that attribute.
 */
function getAllValues(data, path) {
  const values = [];
  const successFunction = (v) => values.push(v);
  extractValues(data, path.split('/'), successFunction);
  return values;
}

/**
 * Given JSON data for a series of objects and the path to a particular attribute,
 * go through those objects and compile an array of UNIQUE values for that attribute.
 */
function getUniqueValues(data, path) {
  const values = new Set();
  const successFunction = (v) => values.add(v);
  extractValues(data, path.split('/'), successFunction);
  return Array.from(values);
}

/**
 * Given JSON data and a path to some attribute, recursively search through the data
 * until finding the end of the path. Then call successFunction on the result.
 */
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

const Data = {

  /**
   * getFilterChoices() returns an array of available choices for the filter that is passed in.
   * 
   * Filters represent a certain attribute, so this routine works by querying the MBTA API and
   * extracting all possible unique values for that attribute.
   */
  async getFilterChoices(filter) {
    const object = await Params.objectProps(filter.for_object);
    if ((object.name in mbtaApiObjectPaths) && (filter.json_path)) {
      const response = await fetch(mbtaApiObjectPaths[object.name]);
      const json = await response.json();
      const internalValues = getUniqueValues(json, filter.json_path);
      const choices = await mapFilterValuesToNames(filter, internalValues);
      return choices.sort(getFilterSortFunction(filter));
    } else {
      return [];
    }
  },

};

export default Data;