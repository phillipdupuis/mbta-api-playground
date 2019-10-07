import * as checkboxes from './checkboxes.js';
import * as filters from './filters.js';
import * as params from './params.js';
import elements from './elements.js';

// helper functions
const showLoadingScreen = (message = 'Loading...') => {
	document.getElementById('loading-screen-message').innerText = message;
	$('#modal-loading-screen').modal('show');
};
const hideLoadingScreen = () => {
	$('#modal-loading-screen').modal('hide');
};

// event triggers 
elements.primaryObject.onchange = (event) => handleChangePrimaryObject(event.target.value);
elements.includes.onchange = (event) => handleChangeIncludes(event);
elements.form.onsubmit = () => showLoadingScreen('Retrieving data...');

// set initial values.
// also run the onchange logic for the primary object to ensure the form is fully reset. 
elements.filters.value = JSON.stringify({});
elements.primaryObject.value = '';
handleChangePrimaryObject('');


async function handleChangePrimaryObject(pk) {

	showLoadingScreen();
	checkboxes.hide(elements.includes, 'all');
	checkboxes.hide(elements.attributes, 'all');
	filters.remove();

	if (pk) {
		const object = await params.objectProps(pk);
		console.log('object is', object);
		checkboxes.show(elements.includes, object.includes);
		checkboxes.showAndSelect(elements.attributes, object.attributes);
		filters.add(object.filters);
	}
	hideLoadingScreen();
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
