document.getElementById('report_form').onsubmit = (event) => {
    event.preventDefault();
    createReport();
}


async function createReport() {
    showLoadingScreen();
    const formContainer = document.getElementById('report_form_container');
    const reportContainer = document.getElementById('report-container');
    const url = reportUrl();
    try {
        const response = await fetch(url);
        if (response.status === 200) {
            const srcdoc = await response.text();
            const iframe = document.createElement('iframe');
            iframe.setAttribute('id', 'report-iframe');
            iframe.setAttribute('class', 'w-100');
            iframe.setAttribute('srcdoc', srcdoc);
            iframe.onload = resizeIframe;
            reportContainer.append(iframe);
        } else {
            reportContainer.innerText = 'Sorry, something went wrong.';
        }
    } catch (e) {
        reportContainer.innerText = 'Sorry, something went wrong.';
    }
    formContainer.hidden = true;
    reportContainer.hidden = false;
    hideLoadingScreen();
}


function showLoadingScreen() {
    document.getElementById('loading-screen-message').innerText = 'Generating report - this may take a while...';
    $('#modal-loading-screen').modal('show');
}


function hideLoadingScreen() {
    $('#modal-loading-screen').modal('hide');
}


function reportUrl() {
    let url = document.getElementById('report_form').dataset.endpoint;
    const correlations = (
        Array.from(document.getElementById('id_report_correlations').querySelectorAll('input[type=checkbox]'))
            .filter(elem => elem.checked)
            .map(elem => elem.value)
    );
    const correlationsParam = (correlations.length > 0) ? correlations.join(',') : 'NONE';
    url += `${correlationsParam}/`;
    return url;
}


function resizeIframe() {
    const iframe = document.getElementById('report-iframe');
    const height = Number(iframe.contentWindow.document.body.scrollHeight);
    if (height > 0) {
        iframe.height = `${height + 100}px`;
    } else {
        window.setTimeout(resizeIframe, 100);
    }
}