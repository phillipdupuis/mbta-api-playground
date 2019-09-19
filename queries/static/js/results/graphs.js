const plotParams = JSON.parse(document.getElementById('plot_params').textContent);

const graphForm = document.getElementById('graph_form');
const graphFormElements = {
    type: document.getElementById('graph_type'),
    x: document.getElementById('graph_x'),
    submitButton: document.getElementById('create_graph_btn'),
}

let graphCounter = 0;

resetGraphForm();


function resetGraphForm() {
    resetType();
    graphFormElements.submitButton.disabled = false;
    graphFormElements.submitButton.innerHTML = 'Create';
}


function resetType() {
    const elem = graphFormElements.type;
    elem.value = '';
    elem.required = true;
    resetX();
}


function resetX() {
    const elem = graphFormElements.x;
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
    const type = graphFormElements.type.value;
    if (type) {
        const choices = plotParams.x_options_per_type[type];
        choices.forEach(v => {
            const option = document.createElement('option');
            option.value = v;
            option.innerHTML = v;
            elem.append(option);
        });
        elem.required = (choices.length > 0) ? true : false;
    }
    elem.value = '';
}


graphFormElements.type.onchange = (event) => {
    resetX();
}


graphForm.onsubmit = async (event) => {
    event.preventDefault();
    const baseUrl = graphFormElements.submitButton.dataset.endpoint;
    const divId = getGraphDivId();
    const type = graphFormElements.type.value;
    let url;
    if (type === 'geo') {
        url = `${baseUrl}${divId}/geo/`;
    } else {
        const x = (graphFormElements.x.value) ? graphFormElements.x.value : '';
        url = `${baseUrl}${divId}/${type}/${x}/`;
    }
    // show spinny thing 
    graphFormElements.submitButton.disabled = true;
    graphFormElements.submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
    // fetch the data and embed the graph 
    const response = await fetch(url);
    const json = await response.json();
    Bokeh.embed.embed_item(json);
    // reset the graph form
    resetGraphForm();
}


function getGraphDivId() {
    graphCounter++;
    //
    const div = document.createElement('div');
    div.id = `graph_${graphCounter}`;
    div.className = 'card-body';
    // put it inside a container element
    const container = document.createElement('div');
    container.className = 'card mt-2';
    container.append(div);
    document.getElementById('id_graphs').append(container);
    //
    return div.id;
}

