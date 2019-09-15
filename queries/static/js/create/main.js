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


async function handleChangePrimaryObject(pk) {
	checkboxes.hide(elements.includes, 'all');
	checkboxes.hide(elements.attributes, 'all');
	checkboxes.deselect(elements.includes, 'all');
	checkboxes.deselect(elements.attributes, 'all');
	filters.remove();
	if (pk) {
		const objectData = await data.getObjectData(pk);
		
		const includeIds = objectData['includes'].map(item => String(item['id']));
		checkboxes.show(elements.includes, includeIds);

		const attributeIds = objectData['attributes'].map(item => String(item['id']));
		checkboxes.show(elements.attributes, attributeIds);
		checkboxes.select(elements.attributes, attributeIds);

		filters.add(objectData['filters']);
	}
}


async function handleChangeIncludes(event) {
	const id = event.target.value;
	const primaryObjectData = await data.getObjectData(elements.primaryObject.value);
	const includeData = primaryObjectData['includes'].find(item => String(item.id) === id);
	const includeObjectId = includeData['associated_object'];
	if (includeObjectId) {
		const objectData = await data.getObjectData(includeObjectId);
		const attributeIds = objectData['attributes'].map(item => String(item['id']));
		if (event.target.checked) {
			checkboxes.show(elements.attributes, attributeIds);
			checkboxes.select(elements.attributes, attributeIds);
		} else {
			checkboxes.hide(elements.attributes, attributeIds);
			checkboxes.deselect(elements.attributes, attributeIds);
		}

	}
}


function displayLoadingIndicator() {
    const button = document.getElementById('get_results_btn');
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
}