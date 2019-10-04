const loadedContent = {
    pandasProfilingReport: false,
};


$('#id_tab_report').on('show.bs.tab', function (e) {
    if (!(loadedContent.pandasProfilingReport)) {
        embedPandasProfilingReport();
    }
});


async function embedPandasProfilingReport() {

    document.getElementById('loading-screen-message').innerText = 'Generating Pandas Profiling Report - this may take a while...';
    $('#modal-loading-screen').modal('show');

    const container = document.getElementById('report-container');
    try {
        const response = await fetch(container.dataset.endpoint);
        if (response.status === 200) {
            const srcdoc = await response.text();
            const iframe = document.createElement('iframe');
            iframe.setAttribute('id', 'report-iframe');
            iframe.setAttribute('width', '100%');
            iframe.setAttribute('srcdoc', srcdoc);
            iframe.onload = resizeIframe;
            container.append(iframe);
        } else {
            container.innerText = 'Sorry, something went wrong.';
        }
    } catch (e) {
        container.innerText = 'Sorry, something went wrong.';
    }

    loadedContent.pandasProfilingReport = true;
    $('#modal-loading-screen').modal('hide');

    console.log('done');
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
