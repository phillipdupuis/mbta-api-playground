// // import filtersElem from './filters.js';
// import * as elements from './elements.js';

// initialize variables...
const elements = {
    primaryObject: document.getElementById('id_primary_object'),
    includes: document.getElementById('id_includes'),
    attributes: document.getElementById('id_attributes'),
    filters: document.getElementById('id_filters'),
    filtersList: document.getElementById('filters_list'),
}
const objectDataEndpoint = elements.primaryObject.dataset.endpoint;
let primaryObjectData;
// set up event triggers and initial values... 
elements.primaryObject.onchange = (event) => handleChangePrimaryObject(event.target.value);
elements.includes.onchange = (event) => handleChangeIncludes(event);
elements.filters.value = JSON.stringify({});
document.querySelector('form').onsubmit = displayLoadingIndicator;
// and finally, run the onchange logic for the current primary object value.
handleChangePrimaryObject(elements.primaryObject.value);


async function getObjectData(pk) {
    const response = await fetch(objectDataEndpoint + pk);
    const json = await response.json();
    return json;
}

async function handleChangePrimaryObject(pk) {
    primaryObjectData = undefined;
    hideCheckboxes(elements.includes, 'all');
    hideCheckboxes(elements.attributes, 'all');
    deselectCheckboxes(elements.includes, 'all');
    deselectCheckboxes(elements.attributes, 'all');
    removeFilters();
    if (pk) {
        primaryObjectData = await getObjectData(pk);

        const includes = primaryObjectData['includes'].map(item => item['id']).map(String);
        showCheckboxes(elements.includes, includes);

        const attributes = primaryObjectData['attributes'].map(item => item['id']).map(String);
        showCheckboxes(elements.attributes, attributes);
        selectCheckboxes(elements.attributes, attributes);

        const filters = primaryObjectData['filters'];
        addFilters(filters);
    }
}

async function handleChangeIncludes(event) {
    const pk = event.target.value;
    const includeData = primaryObjectData['includes'].find(item => String(item.id) === pk);
    const associatedObjectPk = includeData['associated_object'];
    if (associatedObjectPk) {
        const objectData = await getObjectData(associatedObjectPk);
        const attributes = objectData['attributes'].map(item => item['id']).map(String);
        if (event.target.checked) {
            showCheckboxes(elements.attributes, attributes);
            selectCheckboxes(elements.attributes, attributes);
        } else {
            hideCheckboxes(elements.attributes, attributes);
            deselectCheckboxes(elements.attributes, attributes);
        }
    }
}

// Removing all child elements
function removeAllChildElements(elem) {
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
}

// Gathering lists of elements
function getAllCheckboxes(parentElem) {
    return Array.from(parentElem.querySelectorAll('input[type="checkbox"]'));
}

function getSelectCheckboxes(parentElem, values) {
    return getAllCheckboxes(parentElem).filter(e => values.includes(e.value));
}

function getLiAncestors(elems) {
    return elems.map(e => e.closest('li'));
}

// Selecting/deselecting checkboxes
function setCheckboxesSelectedState(parentElem, state, values = 'all') {
    const checkboxes = (values === 'all') ? getAllCheckboxes(parentElem) : getSelectCheckboxes(parentElem, values);
    checkboxes.forEach(e => e.checked = state);
}

function selectCheckboxes(parentElem, values) {
    setCheckboxesSelectedState(parentElem, true, values);
}

function deselectCheckboxes(parentElem, values) {
    setCheckboxesSelectedState(parentElem, false, values);
}

// Showing/hiding checkboxes
function setCheckboxesHiddenState(parentElem, state, values = 'all') {
    const checkboxes = (values === 'all') ? getAllCheckboxes(parentElem) : getSelectCheckboxes(parentElem, values);
    getLiAncestors(checkboxes).forEach(li => li.hidden = state);
}

function showCheckboxes(parentElem, values) {
    setCheckboxesHiddenState(parentElem, false, values);
}

function hideCheckboxes(parentElem, values) {
    setCheckboxesHiddenState(parentElem, true, values);
}

// Adding/editing/removing filters
function addFilters(filters) {
    filters
        .sort(filter => filter['name'])
        .forEach(filter => {
            const id = `id_filters_${filter['id']}`;
            const name = filter['name'];
            const associatedObject = filter['associated_object'];
            // label 
            const label = document.createElement('div');
            label.className = 'input-group-prepend w-25';
            label.innerHTML = `<span class="input-group-text text-truncate w-100">${name}</span>`;
            // input
            const input = document.createElement('input');
            input.className = 'form-control text-left text-truncate w-75';
            input.setAttribute('type', 'button');
            input.onclick = () => editFilter(input);
            input.dataset.id = filter['id'];
            input.dataset.name = name;
            input.dataset.associatedObject = (associatedObject) ? associatedObject : '';
            // put it all together
            const elem = document.createElement('div');
            elem.className = 'input-group mb-2';
            elem.append(label);
            elem.append(input);
            elements.filtersList.append(elem);
        });
}

function removeFilters() {
    removeAllChildElements(elements.filtersList);
}

async function getFilterChoices(filterInput) {
    if (filterInput.dataset.associatedObject) {
        const objectData = await getObjectData(filterInput.dataset.associatedObject);
        const response = await fetch('https://api-v3.mbta.com' + objectData['path']);
        const json = await response.json();
        return json['data'].map(item => item['id']);
    } else {
        const bleh = await fetch('https://api-v3.mbta.com' + primaryObjectData['path']);
        const json = await bleh.json();
        const name = filterInput.dataset.name;
        let choices = new Set();
        searchArrayForValues(json['data'], name, choices);
        return Array.from(choices).sort();
    }
}

function searchArrayForValues(arr, valueName, outputSet) {
    arr.forEach(item => {
        if (Array.isArray(item)) {
            searchArrayForValues(item, valueName, outputSet);
        } else if (typeof item === 'object' && (item !== null)) {
            searchObjectForValues(item, valueName, outputSet);
        }
    });
}

function searchObjectForValues(obj, valueName, outputSet) {
    if (valueName in obj) {
        outputSet.add(obj[valueName]);
    } else {
        Object.values(obj).forEach(v => {
            if (Array.isArray(v)) {
                searchArrayForValues(v, valueName, outputSet);
            } else if (typeof v === 'object' && (v !== null)) {
                searchObjectForValues(v, valueName, outputSet);
            }
        });
    }
}

async function editFilter(filterInput) {
    const modal = document.getElementById('modal');
    // Set the title 
    modal.querySelector('.modal-title').innerText = `Filters: ${filterInput.dataset.name}`;
    // Set the body content
    const body = modal.querySelector('.modal-body');
    removeAllChildElements(body);
    const ul = document.createElement('ul');
    const options = await getFilterChoices(filterInput);
    const selectedValues = JSON.parse(elements.filters.value)[filterInput.dataset.id] || [];
    options.sort().forEach(value => {
        const li = document.createElement('li');
        const inputHtml = `<input class="form-check-input" type="checkbox" id="${value}" value="${value}" ${(selectedValues.includes(value)) ? 'checked' : ''}>`;
        const labelHtml = `<label class="form-check-label" for="${value}">${value}</label>`;
        li.innerHTML = inputHtml + labelHtml;
        ul.append(li);
    });
    body.append(ul);
    // Set the save function
    modal.querySelector('#modal-save-btn').onclick = () => handleSaveFilter(filterInput);
    // Show the modal
    $('#modal').modal('show');
}

function handleSaveFilter(filterInput) {
    let values = [];
    let checkboxes = Array.from(document.getElementById('modal').querySelectorAll('input[type=checkbox]'));
    checkboxes.filter(e => e.checked).forEach(e => values.push(String(e.value)));
    filterInput.value = values.join(',');
    //
    let obj = JSON.parse(elements.filters.value);
    if (values.length === 0) {
        delete obj[filterInput.dataset.id];
    } else {
        obj[filterInput.dataset.id] = values;
    }
    elements.filters.value = JSON.stringify(obj);
    //
    $('#modal').modal('hide');
}


// Loading indicator
function displayLoadingIndicator() {
    const button = document.getElementById('get_results_btn');
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
}