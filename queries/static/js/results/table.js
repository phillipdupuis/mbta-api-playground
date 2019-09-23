const elements = {
    editColumnsButton: document.getElementById('edit_columns_button'),
    table: document.getElementById('full-table').querySelector('table'),
    modal: document.getElementById('modal'),
}


elements.editColumnsButton.onclick = (event) => {

    elements.modal.querySelector('.modal-title').innerText = 'Edit Columns Displayed';
    elements.modal.querySelector('#modal-save-btn').onclick = () => handleSave();

    const body = elements.modal.querySelector('.modal-body');
    while (body.firstChild) {
        body.removeChild(body.firstChild);
    }
    body.scrollTop = 0;

    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    elements.table.querySelectorAll('th').forEach(col => {
        
        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.setAttribute('type', 'checkbox');
        input.id = col.id;
        input.value = col.id;
        input.checked = (col.hidden) ? false : true;

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = input.id;
        label.innerText = col.id;

        const li = document.createElement('li');
        li.append(input);
        li.append(label);
        ul.append(li);
    });
    body.append(ul);

    $('#modal').modal('show');
}


function handleSave() {
    const columnsDisplayed =
        Array.from(elements.modal.querySelectorAll('input[type=checkbox]'))
        .filter(col => col.checked)
        .map(col => col.value);
    setColumnsDisplayed(columnsDisplayed);
    $('#modal').modal('hide');
}


function setColumnsDisplayed(columnIds) {
    elements.table.querySelectorAll('th').forEach(th => {
        th.hidden = (columnIds.includes(th.id)) ? false : true;
    });
    elements.table.querySelectorAll('td').forEach(td => {
        td.hidden = (columnIds.includes(td.id.split('|')[1])) ? false : true;
    });
}