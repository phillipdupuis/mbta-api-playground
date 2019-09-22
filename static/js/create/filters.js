import * as data from './data.js';
import elements from './elements.js';

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
            input.dataset.forObject = filter.for_object;
            input.dataset.associatedObject = (filter.associated_object) ? filter.associated_object : '';
            input.dataset.jsonPath = (filter.json_path) ? filter.json_path : '';
            // put it all together
            const elem = document.createElement('div');
            elem.className = 'input-group mb-2';
            elem.append(label);
            elem.append(input);
            elements.filtersList.append(elem);
        });
}


export function remove() {
    removeAllChildElements(elements.filtersList);
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
    ul.style.listStyle = 'none';
    const choices = await data.getFilterChoices(filterInput.dataset.forObject, filterInput.dataset.id);
    const selectedValues = JSON.parse(elements.filters.value)[filterInput.dataset.id] || [];
    choices.forEach(([value, name]) => {
        const li = document.createElement('li');
        const checked = (selectedValues.includes(value)) ? 'checked' : '';
        const inputHtml = `<input class="form-check-input" type="checkbox" id="${value}" value="${value}" ${checked}>`;
        const labelHtml = `<label class="form-check-label" for="${value}">${name}</label>`;
        li.innerHTML = inputHtml + labelHtml;
        ul.append(li);
    });
    body.append(ul);
    // Set the save function
    modal.querySelector('#modal-save-btn').onclick = () => handleSaveFilter(filterInput);
    // Show the modal
    $('#modal').modal('show');
    $('#modal').scrollTop(0);
}


function handleSaveFilter(filterInput) {

    const values = Array.from(document.getElementById('modal').querySelectorAll('input[type=checkbox]'))
        .filter(elem => elem.checked)
        .map(elem => elem.value);

    // Set the display value to be a comma-separated list 
    filterInput.value = values.join(',');

    // Store the values in the JSON object associated with the form element.
    // This is how they get added to the form which django processes
    const formValue = JSON.parse(elements.filters.value);
    if (values.length === 0) {
        delete formValue[filterInput.dataset.id];
    } else {
        formValue[filterInput.dataset.id] = values;
    }
    elements.filters.value = JSON.stringify(formValue);

    // aaaaand of course hide the modal
    $('#modal').modal('hide');
}
