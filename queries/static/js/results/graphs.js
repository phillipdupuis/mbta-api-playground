const columnTypes = JSON.parse(document.getElementById('extra_df_data').dataset.columnTypes.replace(/'/g, '"'));
const resultsEndpoint = document.getElementById('create_graph_button').dataset.resultsUrl;

document.getElementById('create_graph_button').onclick = (event) => {
	const modal = document.getElementById('modal');
    // Set the title 
    modal.querySelector('.modal-title').innerText = `Create a graph`;
    // Set the body content
    const body = modal.querySelector('.modal-body');
    body.scrollTop = 0;
    while (body.firstChild) {
    	body.removeChild(body.firstChild);
    };
    // Add element for selecting graph type
    body.append(createSelect('Type', 'graph-type-input', ['bar']));
    // If bar graph, want the categorical columns
    const categoricalColumns = Object.entries(columnTypes).filter(([col, type]) => type === 'category').map(([col, type]) => col);
    body.append(createSelect('Column', 'graph-column-input', categoricalColumns));
    // Set the save function
    modal.querySelector('#modal-save-btn').onclick = () => handleSaveGraphParams();
    // Show the modal
    $('#modal').modal('show');
}


async function handleSaveGraphParams() {
	const type = document.getElementById('graph-type-input').value;
	const columnOne = document.getElementById('graph-column-input').value;
	const url = resultsEndpoint + 'create_graph/' + type + '/' + columnOne + '/';
	const response = await fetch(url);
	console.log('response', response);
	$('#modal').modal('hide');
}


function createSelect(label, id, options) {
	const div = document.createElement('div');
	div.className = 'form-group row';
	const labelElem = document.createElement('label');
	labelElem.htmlFor = id;
	labelElem.className = 'col-sm-2 col-form-label';
	labelElem.innerText = label;
	const inputElem = document.createElement('div');
	inputElem.className = 'col-sm-10';
	const selectElem = document.createElement('select');
	selectElem.className = 'form-control';
	selectElem.id = id;
	options.forEach(option => {
		const optionElem = document.createElement('option');
		optionElem.value = option;
		optionElem.innerHTML = option;
		selectElem.append(optionElem);
	});
	inputElem.append(selectElem);
	div.append(labelElem);
	div.append(inputElem);
	return div;
}
