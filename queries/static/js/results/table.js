const elements = {
    editColumnsButton: document.getElementById('edit_columns_button'),
    table: document.getElementById('full-table').querySelector('table'),
    modal: document.getElementById('modal'),
};


elements.editColumnsButton.onclick = (event) => {
    elements.modal.querySelector('.modal-title').innerText = 'Edit Columns Displayed';
    // Set the body content
    const body = modal.querySelector('.modal-body');
    while (body.firstChild) {
        body.removeChild(body.firstChild);
    }
    const ul = document.createElement('ul');
    elements.table.querySelectorAll('th').forEach(col => {
        const li = document.createElement('li');
        const inputHtml = `<input class="form-check-input" type="checkbox" id="${col.id}" value="${col.id}" ${(col.hidden) ? '' : 'checked'}>`;
        const labelHtml = `<label class="form-check-label" for="${col.id}">${col.id}</label>`;
        li.innerHTML = inputHtml + labelHtml;
        ul.append(li);
    });
    body.append(ul);
    // Set the save function
    modal.querySelector('#modal-save-btn').onclick = () => handleSave();
    // Show the modal
    $('#modal').modal('show');
    $('#modal').scrollTop(0);
}


function handleSave() {
    const columnsDisplayed =
        Array.from(elements.modal.querySelectorAll('input[type=checkbox]'))
        .filter(col => col.checked)
        .map(col => col.value);
    setColumnsDisplayed(columnsDisplayed);
    $('#modal').modal('hide');
}


function getColumnsDisplayed() {
    return Array.from(
        elements.table.querySelectorAll('th')
        .filter(th => !(th.hidden))
        .map(th => th.id)
    );
}


function setColumnsDisplayed(columnIds) {
    elements.table.querySelectorAll('th').forEach(th => {
        th.hidden = (columnIds.includes(th.id)) ? false : true;
    });
    elements.table.querySelectorAll('td').forEach(td => {
        td.hidden = (columnIds.includes(td.id.split('|')[1])) ? false : true;
    });
}