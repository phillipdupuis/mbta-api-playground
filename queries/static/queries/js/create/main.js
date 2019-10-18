import Checkboxes from './checkboxes.js';
import Filters from './filters.js';
import Params from './params.js';
import Elements from './elements.js';

// helper functions
const showLoadingScreen = (message = 'Loading...') => {
	document.getElementById('loading-screen-message').innerText = message;
	$('#modal-loading-screen').modal('show');
};

const hideLoadingScreen = () => {
	$('#modal-loading-screen').modal('hide');
};

// event triggers 
Elements.primaryObject.onchange = (event) => handleChangePrimaryObject(event.target.value);
Elements.includes.onchange = (event) => handleChangeIncludes(event);
Elements.form.onsubmit = () => showLoadingScreen('Retrieving data...');

// set initial values and run the onchange logic for the primary object to ensure the form is fully reset. 
Elements.filters.value = JSON.stringify({});
Elements.primaryObject.value = '';
handleChangePrimaryObject('');

/**
 * Called upon changing the primary object.
 * We want to make sure that the dependent form fields (includes, attributes, filters)
 * are all updated appropriately.
 */
async function handleChangePrimaryObject(pk) {
	showLoadingScreen();
	Checkboxes.hide(Elements.includes, 'all');
	Checkboxes.hide(Elements.attributes, 'all');
	Filters.remove();
	if (pk) {
		const object = await Params.objectProps(pk);
		Checkboxes.show(Elements.includes, object.includes);
		Checkboxes.showAndSelect(Elements.attributes, object.attributes);
		Filters.add(object.filters);
	}
	hideLoadingScreen();
}

/**
 * Called upon selecting or deselecting an 'Include' option.
 * If the include represents an object, we will show/hide that object's
 * attributes in the 'attributes' checkbox list.
 */
async function handleChangeIncludes(event) {
	const include = Params.includeProps(event.target.value);
	if (include.associated_object) {
		const object = await Params.objectProps(include.associated_object);
		if (event.target.checked) {
			Checkboxes.showAndSelect(Elements.attributes, object.attributes);
		} else {
			Checkboxes.hide(Elements.attributes, object.attributes);
		}
	}
}