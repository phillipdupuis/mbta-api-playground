# MBTA API Playground
[https://www.mbta-api-playground.com/](https://www.mbta-api-playground.com/)<br>
Learn how to work with the MBTA V3 API by constructing queries and interacting with the results.

## Creating queries
Users can build queries in which they specify:
* The primary object (ex: Alert, Route, Facility, Vehicle, etc.)
* The related objects that should also be included in the results
* The attributes that should be returned for each object
* Filters for limiting what object instances are returned

## Viewing results
Upon executing a query, the user is brought to a results page where they can view:
* A brief summary of the response (status code, size, and query parameters)
* A table of the response data
    * It can be downloaded as a CSV file for further analysis
* A profile report generated by [pandas-profiling](https://github.com/pandas-profiling/pandas-profiling)
    * Users can customize what correlations are calculated
* The raw response data as pretty-printed JSON
* Interactive geolocation plots for any objects which have 'latitude' and 'longitude' attributes.
    * These plots are generated using [Bokeh](https://bokeh.pydata.org/en/latest/docs/user_guide/geo.html)

## Built With
* Django
* Django REST framework
* Vanilla ES6 JavaScript (the only exception is jQuery was used for showing/hiding modals)

## Example: finding facilities which have bike storage or electric car chargers
<details>
   <summary>Creating the query</summary>
   
   ![filtered facility query](https://github.com/phillipdupuis/mbta-api-playground/blob/master/core/static/core/screenshots/create_query_facility_with_filters.png)
</details>
<details>
   <summary>Results: Summary</summary>
         
   ![results summary](https://github.com/phillipdupuis/mbta-api-playground/blob/master/core/static/core/screenshots/fac_filt_res_summary.png)
</details>
<details>
   <summary>Results: Table</summary>
         
   ![results table](https://github.com/phillipdupuis/mbta-api-playground/blob/master/core/static/core/screenshots/fac_filt_res_table.png)
</details>
<details>
   <summary>Results: Report</summary>
         
   ![results report](https://github.com/phillipdupuis/mbta-api-playground/blob/master/core/static/core/screenshots/fac_filt_res_report.png)
</details>
<details>
   <summary>Results: JSON</summary>
         
   ![results json](https://github.com/phillipdupuis/mbta-api-playground/blob/master/core/static/core/screenshots/fac_filt_res_json.png)
</details>
<details>
   <summary>Results: Locations</summary>
         
   ![results locations](https://github.com/phillipdupuis/mbta-api-playground/blob/master/core/static/core/screenshots/fac_filt_res_locations.png)
</details>
