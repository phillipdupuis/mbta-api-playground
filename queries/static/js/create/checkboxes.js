// Gathering lists of elements
function getAll(parentElem) {
    return Array.from(parentElem.querySelectorAll('input[type="checkbox"]'));
}

function getSelect(parentElem, values) {
    return getAll(parentElem).filter(e => values.includes(e.value));
}

// Selecting/deselecting checkboxes
function setSelectedState(parentElem, state, values = 'all') {
    const checkboxes = (values === 'all') ? getAll(parentElem) : getSelect(parentElem, values);
    checkboxes.forEach(e => e.checked = state);
}

export function select(parentElem, values) {
    setSelectedState(parentElem, true, values);
}

export function deselect(parentElem, values) {
    setSelectedState(parentElem, false, values);
}

// Showing/hiding checkboxes
function setHiddenState(parentElem, state, values = 'all') {
    const checkboxes = (values === 'all') ? getAll(parentElem) : getSelect(parentElem, values);
    checkboxes.map(e => e.closest('li')).forEach(li => li.hidden = state);
}

export function show(parentElem, values) {
    setHiddenState(parentElem, false, values);
}

export function hide(parentElem, values) {
    setHiddenState(parentElem, true, values);
}