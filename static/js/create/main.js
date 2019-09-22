import * as checkboxes from './checkboxes.js';
import * as data from './data.js';
import * as filters from './filters.js';
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


function getId(obj) {
	return String(obj.id);
}


async function handleChangePrimaryObject(pk) {

	disableSubmit();
	checkboxes.hide(elements.includes, 'all');
	checkboxes.hide(elements.attributes, 'all');
	filters.remove();

	if (pk) {
		const objIncludes = await data.objectIncludes(pk);
		checkboxes.show(elements.includes, objIncludes.map(getId));

		const objAttributes = await data.objectAttributes(pk);
		checkboxes.showAndSelect(elements.attributes, objAttributes.map(getId));

		const objFilters = await data.objectFilters(pk);
		filters.add(objFilters);
	}

	enableSubmit();
}


async function handleChangeIncludes(event) {

	const id = event.target.value;
	const primaryObjIncludes = await data.objectIncludes(elements.primaryObject.value);
	const props = primaryObjIncludes.find(item => getId(item) === id);

	if (props.associated_object) {
		const incAttributes = await data.objectAttributes(props.associated_object);
		const attributeIds = incAttributes.map(getId);
		if (event.target.checked) {
			checkboxes.showAndSelect(elements.attributes, attributeIds);
		} else {
			checkboxes.hide(elements.attributes, attributeIds);
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