const endpoints = JSON.parse(document.getElementById('endpoints').textContent);

const cachedData = {
    objects: {},
    includes: {},
    attributes: {},
    filters: {},
}

// simple format function to ensure keys are always the same datatype

function formatPk(pk) {
    return String(pk);
}

// Quick & dirty way to hide include/filter/attribute options that aren't working.
// Really should be handled by editing the "active" field in django admin and then
// using that to filter querysets.

const hidden = {
    includes: {
        Alert: ['stops', 'routes', 'trips', 'facilities'],
        Line: ['routes'],
        Route: ['route_patterns'],
        Stop: ['facilities', 'route', 'parent_station', 'child_stops', 'recommended_transfers'],
    },
    attributes: {},
    filters: {
        Alert: ['banner', 'datetime'],
        Route: ['date', 'stop', 'direction_id'],
        RoutePattern: ['direction_id', 'stop'],
        Stop: ['date', 'direction_id', 'latitude', 'longitude', 'radius', 'route', 'route_type'],
        Vehicle: ['direction_id', 'route_type'],
    },
}

// Public functions 

export async function objectProps(pk) {
    pk = formatPk(pk);
    if (pk in cachedData.objects) {
        return cachedData.objects[pk];
    } else {
        const response = await fetch(endpoints.params.objects + pk);
        const data = await response.json();
        // drop includes/filters/attributes that should be hidden
        const filterEntries = (data, prop) => {
            const hiddenNames = hidden[prop][data.name] || [];
            data[prop] = data[prop].filter(entry => !hiddenNames.includes(entry.name));
        }
        ['includes', 'filters', 'attributes'].forEach(prop => filterEntries(data, prop));
        // put all the data for includes, filters, and attributes in their own spots.
        const extractNestedItems = (data, prop) => {
            data[prop].forEach(entry => cachedData[prop][formatPk(entry.id)] = entry);
            data[prop] = data[prop].map(entry => entry.id);
        }
        ['includes', 'filters', 'attributes'].forEach(prop => extractNestedItems(data, prop));
        // and now store the updated object properties in the cache
        cachedData.objects[pk] = data;
        return data;
    }
}


export function includeProps(pk) {
    return cachedData.includes[formatPk(pk)];
}


export function attributeProps(pk) {
    return cachedData.attributes[formatPk(pk)];
}


export function filterProps(pk) {
    return cachedData.filters[formatPk(pk)];
}
