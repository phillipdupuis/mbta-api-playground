import Data from './data.js';
import Params from './params.js';
import Elements from './elements.js';


function showModal(title, handleSaveFunc, bodyElems) {
  const modal = document.getElementById('modal');
  modal.querySelector('.modal-title').innerText = title;
  modal.querySelector('#modal-save-btn').onclick = handleSaveFunc;
  const body = modal.querySelector('.modal-body');
  while (body.firstChild) body.removeChild(body.firstChild);
  bodyElems.forEach(elem => body.append(elem));
  body.scrollTop = 0;
  $('#modal').modal('show');
}

function hideModal() {
  $('#modal').modal('hide');
}

/**
 * Filters object controls creating, removing, editing, and saving the filter
 * input elements. The only functions that should need to be called from outside
 * this module are Filters.add() and Filters.remove().
 */
const Filters = {

  createLabel(filter) {
    const label = document.createElement('label');
    label.className = 'col-sm-3 col-form-label text-truncate';
    label.innerText = filter.name;
    label.htmlFor = filter.id;
    return label;
  },

  createInput(filter) {
    const input = document.createElement('input');
    input.className = 'form-control text-left text-truncate';
    input.setAttribute('type', 'button');
    input.onclick = () => this.handleEdit(filter, input);
    input.dataset.id = filter.id;
    input.dataset.name = filter.name;
    const wrapper = document.createElement('div');
    wrapper.className = 'col-sm-9';
    wrapper.append(input);
    return wrapper;
  },

  createElement(filter) {
    const elem = document.createElement('div');
    elem.className = 'form-group row';
    elem.append(this.createLabel(filter));
    elem.append(this.createInput(filter));
    return elem;
  },

  add(filterPkList) {
      const sortFunction = (a, b) => (a.name === 'id') ? -1 : a.name.localeCompare(b.name);
      filterPkList
        .map(pk => Params.filterProps(pk))
        .sort(sortFunction)
        .forEach(filter => Elements.filtersList.append(this.createElement(filter)));
  },

  remove() {
    const filters = Elements.filtersList;
    while (filters.firstChild) filters.removeChild(filters.firstChild);
  },

  async handleEdit(filter, inputElem) {
    const modalTitle = `Filters: ${filter.name}`;
    const handleSaveFunc = () => this.handleSave(filter, inputElem);
    const choices = await Data.getFilterChoices(filter);
    const selectedChoices = JSON.parse(Elements.filters.value)[filter.id] || [];
    const ul = document.createElement('ul');
    choices.forEach(([value, name]) => {
      const li = document.createElement('li');
      const checked = (selectedChoices.includes(value)) ? 'checked' : '';
      const inputHtml = `<input class="form-check-input" type="checkbox" id="${value}" value="${value}" ${checked}>`;
      const labelHtml = `<label class="form-check-label" for="${value}">${name}</label>`;
      li.innerHTML = inputHtml + labelHtml;
      ul.append(li);
    });
    showModal(modalTitle, handleSaveFunc, [ul]);
  },

  handleSave(filter, inputElem) {
    const values = (
      Array.from(document.getElementById('modal').querySelectorAll('input[type=checkbox]'))
        .filter(elem => elem.checked)
        .map(elem => elem.value)
    );
    inputElem.value = values.join(', ');
    this.updateForm(filter, values);
    hideModal();
  },

  // Handles updating the hidden form field that's sent with the post request.
  // The filters are stored in a JSON object which django parses.
  updateForm(filter, values) {
    const formValue = JSON.parse(Elements.filters.value);
    if (values.length === 0) {
        delete formValue[filter.id];
    } else {
        formValue[filter.id] = values;
    }
    Elements.filters.value = JSON.stringify(formValue);
  },

};

export default Filters;