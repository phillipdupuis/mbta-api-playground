const plotParams = JSON.parse(document.getElementById('plot_params').textContent);

const elements = {
    form: document.getElementById('graph_form'),
    type: document.getElementById('graph_type'),
    x: document.getElementById('graph_x'),
    submitButton: document.getElementById('create_graph_btn'),
    outputDiv: document.getElementById('graph_container'),
}

elements.type.onchange = (event) => handleChangeType(event);
elements.x.onchange = (event) => handleChangeX(event);
elements.form.onsubmit = (event) => handleSubmitForm(event);

resetForm();


function resetForm() {
    resetType();
    elements.submitButton.disabled = false;
    elements.submitButton.innerHTML = 'Create';
}


function resetType() {
    elements.type.value = '';
    elements.type.required = true;
    resetX();
}


function resetX() {
    // remove any existing options
    while (elements.x.firstChild) {
        elements.x.removeChild(elements.x.firstChild);
    }
    // add options which should be available
    if (elements.type.value) {
        const choices = plotParams.x_options_per_type[elements.type.value];
        choices.forEach(choice => {
            const option = document.createElement('option');
            option.value = choice;
            option.innerText = choice;
            elements.x.append(option);
        });
    }
    // set the value, required, and disabled attributes
    elements.x.value = '';
    if (elements.x.children.length > 0) {
        elements.x.required = true;
        elements.x.disabled = false;
    } else {
        elements.x.required = false;
        elements.x.disabled = true;
    }
}


function handleChangeType(event) {
    resetX();
}


function handleChangeX(event) {
    // pass 
}


async function handleSubmitForm(event) {
    event.preventDefault();
    // show loading indicator 
    elements.submitButton.disabled = true;
    elements.submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
    // remove any existing graphs 
    while (elements.outputDiv.firstChild) {
        elements.outputDiv.removeChild(elements.outputDiv.firstChild);
    }
    // fetch the data and embed the graph
    const response = await fetch(graphUrl());
    const json = await response.json();
    Bokeh.embed.embed_item(json);
    // reset button state
    elements.submitButton.disabled = false;
    elements.submitButton.innerHTML = 'Create';
}


function graphUrl() {
    // basic format for all URLs is: <base>/<divGraphGoesIn>/<maxWidth>/<maxHeight>/<type>/
    let url = urlJoin(
        elements.submitButton.dataset.endpoint,
        elements.outputDiv.id,
        Math.round(window.innerWidth * 0.75),
        Math.round(window.innerHeight * 0.66),
        elements.type.value
        );
    // add in additional parameters if they are defined
    if (elements.x.value) {
        url = urlJoin(url, elements.x.value);
    }
    return url;
}


function urlJoin(base, ...args) {
    const formatUrl = (url) => (url.endsWith('/')) ? url : `${url}/`;
    const formatPathPiece = (p) => String(p).split('/').filter(x => x !== '').join('/');
    let url = formatUrl(base);
    args.forEach(item => {
        url = formatUrl(url + formatPathPiece(item));
    });
    return url;
}
