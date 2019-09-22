const plotParams = JSON.parse(document.getElementById('plot_params').textContent);

const graphForm = document.getElementById('graph_form');
const graphFormElements = {
    type: document.getElementById('graph_type'),
    x: document.getElementById('graph_x'),
    submitButton: document.getElementById('create_graph_btn'),
}
const graphContainer = document.getElementById('graph_container');

graphFormElements.type.onchange = (event) => {
    resetX();
}

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
            option.innerText = v;
            elem.append(option);
        });
        elem.required = (choices.length > 0) ? true : false;
    }
    elem.value = '';
    elem.disabled = (elem.children.length > 0) ? false : true;
}


graphForm.onsubmit = async (event) => {
    event.preventDefault();
    // show loading indicator 
    graphFormElements.submitButton.disabled = true;
    graphFormElements.submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
    // remove any existing graphs 
    while (graphContainer.firstChild) {
        graphContainer.removeChild(graphContainer.firstChild);
    }
    // assemble the url
    const url = buildGraphUrl();
    // fetch the data and embed the graph 
    const response = await fetch(url);
    const json = await response.json();
    Bokeh.embed.embed_item(json);
    // reset button state
    graphFormElements.submitButton.disabled = false;
    graphFormElements.submitButton.innerHTML = 'Create';
}


function buildGraphUrl() {
    const base = graphFormElements.submitButton.dataset.endpoint;
    const divId = graphContainer.id;
    const type = graphFormElements.type.value;
    // basic format for all is: <base>/<divGraphGoesIn>/<type>/
    let url = urlJoin(base, divId, type);
    // add in additional parameters
    if (graphFormElements.x.value) {
        url = urlJoin(url, graphFormElements.x.value);
    }
    return url;
}


function urlJoin(base, ...args) {

    const formatUrl = (url) => (url.endsWith('/')) ? url : `${url}/`;
    const formatPathPiece = (p) => p.split('/').filter(x => x !== '').join('/');

    let url = formatUrl(base);
    args.forEach(item => {
        url = formatUrl(url + formatPathPiece(item));
    });
    return url;
}
