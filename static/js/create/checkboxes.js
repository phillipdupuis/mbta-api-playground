function getCheckboxes(parentElem, values) {
    if (values === 'all') {
        return Array.from(parentElem.querySelectorAll('input[type="checkbox"]'));
    } else {
        return Array.from(parentElem.querySelectorAll('input[type="checkbox"]'))
            .filter(checkbox => values.includes(checkbox.value));
    }
}

export function show(parentElem, values = 'all') {
    getCheckboxes(parentElem, values).forEach(checkbox => {
        checkbox.closest('li').hidden = false;
    });
}

export function showAndSelect(parentElem, values = 'all') {
    getCheckboxes(parentElem, values).forEach(checkbox => {
        checkbox.closest('li').hidden = false;
        checkbox.checked = true;
    });
}

export function hide(parentElem, values = 'all') {
    getCheckboxes(parentElem, values).forEach(checkbox => {
        checkbox.closest('li').hidden = true;
        checkbox.checked = false;
    });
}