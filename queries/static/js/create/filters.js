import * as data from './data.js';
import * as params from './params.js';
import elements from './elements.js';

// Adding/editing/removing filters

export function add(filterPkList) {
    const sortFunction = (a, b) => (a.name === 'id') ? -1 : a.name.localeCompare(b.name);
    filterPkList
        .map(pk => params.filterProps(pk))
        .sort(sortFunction)
        .forEach(filter => {

            const label = document.createElement('div');
            label.className = 'input-group-prepend w-25';
            label.innerHTML = `<span class="input-group-text text-truncate w-100">${filter.name}</span>`;

            const input = document.createElement('input');
            input.className = 'form-control text-left text-truncate w-75';
            input.setAttribute('type', 'button');
            input.onclick = () => editFilter(input);
            input.dataset.id = filter.id;
            input.dataset.name = filter.name;

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

    const filter = params.filterProps(filterInput.dataset.id);

    const modal = document.getElementById('modal');
    modal.querySelector('.modal-title').innerText = `Filters: ${filter.name}`;
    modal.querySelector('#modal-save-btn').onclick = () => handleSaveFilter(filterInput);

    const body = modal.querySelector('.modal-body');
    removeAllChildElements(body);
    body.scrollTop = 0;

    const choices = await data.getFilterChoices(filter);
    const selectedValues = JSON.parse(elements.filters.value)[filter.id] || [];
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    choices.forEach(([value, name]) => {
        const li = document.createElement('li');
        const checked = (selectedValues.includes(value)) ? 'checked' : '';
        const inputHtml = `<input class="form-check-input" type="checkbox" id="${value}" value="${value}" ${checked}>`;
        const labelHtml = `<label class="form-check-label" for="${value}">${name}</label>`;
        li.innerHTML = inputHtml + labelHtml;
        ul.append(li);
    });
    body.append(ul);

    $('#modal').modal('show');
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
