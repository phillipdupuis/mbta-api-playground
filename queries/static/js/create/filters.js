import * as data from './data.js';
import elements from './elements.js';

const filtersElem = document.getElementById('id_filters');
const filtersListElem = document.getElementById('filters_list');

// Adding/editing/removing filters
export function add(filters) {
    filters
        .sort(filter => filter.name)
        .forEach(filter => {
            // label 
            const label = document.createElement('div');
            label.className = 'input-group-prepend w-25';
            label.innerHTML = `<span class="input-group-text text-truncate w-100">${filter.name}</span>`;
            // input
            const input = document.createElement('input');
            input.className = 'form-control text-left text-truncate w-75';
            input.setAttribute('type', 'button');
            input.onclick = () => editFilter(input);
            input.dataset.id = filter.id;
            input.dataset.name = filter.name;
            input.dataset.associatedObject = (filter.associated_object) ? filter.associated_object : '';
            // put it all together
            const elem = document.createElement('div');
            elem.className = 'input-group mb-2';
            elem.append(label);
            elem.append(input);
            filtersListElem.append(elem);
        });
}


export function remove() {
    removeAllChildElements(filtersListElem);
}


function removeAllChildElements(elem) {
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
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
    const selectedValues = JSON.parse(filtersElem.value)[filterInput.dataset.id] || [];
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
    let obj = JSON.parse(filtersElem.value);
    if (values.length === 0) {
        delete obj[filterInput.dataset.id];
    } else {
        obj[filterInput.dataset.id] = values;
    }
    filtersElem.value = JSON.stringify(obj);
    //
    $('#modal').modal('hide');
}

async function getFilterChoices(filterInput) {
    if (filterInput.dataset.associatedObject) {
        const objectData = await data.getObjectData(filterInput.dataset.associatedObject);
        const response = await fetch('https://api-v3.mbta.com' + objectData['path']);
        const json = await response.json();
        return json['data'].map(item => item['id']);
    } else {
        const primaryObjectData = await data.getObjectData(document.getElementById('id_primary_object').value);
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
