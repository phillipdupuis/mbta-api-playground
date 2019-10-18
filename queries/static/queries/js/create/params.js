/**
 * Quick & dirty way to hide include/filter/attribute options that aren't working.
 * Really should be handled by editing the "active" field in django admin and then
 * using that to filter querysets.
 */
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
};

/**
 * Main object for getting parameter properties.
 * Outside of this module, should only need access to:
 * Params.objectProps(objectPk)
 * Params.includeProps(includePk)
 * Params.filterProps(filterPk)
 * Params.attributeProps(attributePk)
 */
const Params = {

  endpoints: JSON.parse(document.getElementById('endpoints').textContent),

  cachedData: {
    objects: {},
    includes: {},
    attributes: {},
    filters: {},
  },

  // Drops includes/filters/attributes that should be hidden.
  removeHiddenEntries(data, prop) {
    const hiddenEntries = hidden[prop][data.name] || [];
    data[prop] = data[prop].filter(entry => !hiddenEntries.includes(entry.name));
  },

  // Extracts the bulk of data for includes, filters, and attributes into separate objects.
  // Replaces it with an ID so it's simple to get at that data if needed.
  extractEntries(data, prop) {
    data[prop].forEach(entry => this.cachedData[prop][String(entry.id)] = entry);
    data[prop] = data[prop].map(entry => entry.id);
  },

  // Fetches the properties for an object and stores them in the cache.
  async loadObject(pk) {
    const response = await fetch(this.endpoints.params.objects + pk);
    const data = await response.json();
    ['includes', 'filters', 'attributes'].forEach(prop => {
      this.removeHiddenEntries(data, prop);
      this.extractEntries(data, prop);
    });
    this.cachedData.objects[pk] = data;
  },

  async objectProps(pk) {
    pk = String(pk);
    if (!(pk in this.cachedData.objects)) {
      await this.loadObject(pk);
    }
    return this.cachedData.objects[pk];
  },

  includeProps(pk) {
    return this.cachedData.includes[String(pk)];
  },

  attributeProps(pk) {
    return this.cachedData.attributes[String(pk)];
  },

  filterProps(pk) {
    return this.cachedData.filters[String(pk)];
  },

};

export default Params;