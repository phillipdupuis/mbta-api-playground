import * as checkboxes from './checkboxes.js';
import * as filters from './filters.js';
import * as params from './params.js';
import elements from './elements.js';

// event triggers 
elements.primaryObject.onchange = (event) => handleChangePrimaryObject(event.target.value);
elements.includes.onchange = (event) => handleChangeIncludes(event);
elements.form.onsubmit = () => displayLoadingIndicator();

// set initial values.
// also run the onchange logic for the primary object to ensure the form is fully reset. 
elements.filters.value = JSON.stringify({});
elements.primaryObject.value = '';
handleChangePrimaryObject('');


async function handleChangePrimaryObject(pk) {

	disableSubmit();
	checkboxes.hide(elements.includes, 'all');
	checkboxes.hide(elements.attributes, 'all');
	filters.remove();

	if (pk) {
		const object = await params.objectProps(pk);
		checkboxes.show(elements.includes, object.includes);
		checkboxes.showAndSelect(elements.attributes, object.attributes);
		filters.add(object.filters);
	}

	enableSubmit();
}


async function handleChangeIncludes(event) {

	// Check if the 'include' represents an object.
	// If it does, show or hide that object's attributes.

	const include = params.includeProps(event.target.value);

	if (include.associated_object) {
		const object = await params.objectProps(include.associated_object);
		if (event.target.checked) {
			checkboxes.showAndSelect(elements.attributes, object.attributes);
		} else {
			checkboxes.hide(elements.attributes, object.attributes);
		}
	}
}


function disableSubmit() {
	elements.saveButton.disabled = true;
}


function enableSubmit() {
	elements.saveButton.disabled = false;
}


function displayLoadingIndicator() {
    disableSubmit();
    elements.saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
}