// initialize variables...
const primaryObjectElem = document.getElementById('id_primary_object');
const includesElem = document.getElementById('id_includes');
const attributesElem = document.getElementById('id_attributes');
const objectDataEndpoint = primaryObjectElem.dataset.endpoint;
let primaryObjectData;
// set up event triggers...
primaryObjectElem.onchange = (event) => handleChangePrimaryObject(event.target.value);
includesElem.onchange = (event) => handleChangeIncludes(event);
// and finally, run the onchange logic for the current primary object value.
handleChangePrimaryObject(primaryObjectElem.value);


async function getObjectData(pk) {
    const response = await fetch(objectDataEndpoint + pk);
    const json = await response.json();
    return json;
}


async function handleChangePrimaryObject(pk) {
    primaryObjectData = undefined;
    hideCheckboxes(includesElem, 'all');
    hideCheckboxes(attributesElem, 'all');
    deselectCheckboxes(includesElem, 'all');
    deselectCheckboxes(attributesElem, 'all');
    if (pk) {
        primaryObjectData = await getObjectData(pk);

        const includes = primaryObjectData['includes'].map(item => item['id']).map(String);
        showCheckboxes(includesElem, includes);

        const attributes = primaryObjectData['attributes'].map(item => item['id']).map(String);
        showCheckboxes(attributesElem, attributes);
        selectCheckboxes(attributesElem, attributes);

        const showId = primaryObjectData['can_specify_id'];
    }
}


async function handleChangeIncludes(event) {
    const pk = event.target.value;
    const includeData = primaryObjectData['includes'].find(item => String(item.id) === pk);
    const associatedObjectPk = includeData['associated_object'];
    if (associatedObjectPk) {
        const objectData = await getObjectData(associatedObjectPk);
        const attributes = objectData['attributes'].map(item => item['id']).map(String);
        if (event.target.checked) {
            showCheckboxes(attributesElem, attributes);
            selectCheckboxes(attributesElem, attributes);
        } else {
            hideCheckboxes(attributesElem, attributes);
            deselectCheckboxes(attributesElem, attributes);
        }
    }
}


// Gathering lists of elements
function getAllCheckboxes(parentElem) {
    return Array.from(parentElem.querySelectorAll('input[type="checkbox"]'));
}

function getSelectCheckboxes(parentElem, values) {
    return getAllCheckboxes(parentElem).filter(e => values.includes(e.value));
}

function getLiAncestors(elems) {
    return elems.map(e => e.closest('li'));
}

// Selecting/deselecting checkboxes
function setCheckboxesSelectedState(parentElem, state, values = 'all') {
    checkboxes = (values === 'all') ? getAllCheckboxes(parentElem) : getSelectCheckboxes(parentElem, values);
    checkboxes.forEach(e => e.checked = state);
}

function selectCheckboxes(parentElem, values) {
    setCheckboxesSelectedState(parentElem, true, values);
}

function deselectCheckboxes(parentElem, values) {
    setCheckboxesSelectedState(parentElem, false, values);
}

// Showing/hiding checkboxes
function setCheckboxesHiddenState(parentElem, state, values = 'all') {
    checkboxes = (values === 'all') ? getAllCheckboxes(parentElem) : getSelectCheckboxes(parentElem, values);
    getLiAncestors(checkboxes).forEach(li => li.hidden = state);
}

function showCheckboxes(parentElem, values) {
    setCheckboxesHiddenState(parentElem, false, values);
}

function hideCheckboxes(parentElem, values) {
    setCheckboxesHiddenState(parentElem, true, values);
}





// function deselectAllCheckboxes()


// function uncheckAll(parentElem) {
//     parentElem.querySelectorAll('input[type="checkbox"]').forEach(e => { e.checked = false });
// }

// function checkAllVisible(parentElem) {
//     let visibleChildren = Array.from(parentElem.children).filter(e => !e.hidden);
//     visibleChildren.map(e => e.querySelector('input[type=checkbox]')).forEach(checkboxElem => {
//         checkboxElem.checked = true;
//     })
// }

// function hideAllChildren(parentElem) {
//     Array.from(parentElem.children).forEach(childElem => {
//         childElem.hidden = true;
//     });
// }

// function showInputChildren(parentElem, valuesToShow) {
//     Array.from(parentElem.children)
//         .filter(elem => valuesToShow.includes(elem.querySelector('input').value))
//         .forEach(elem => elem.hidden = false);
// }

// function onChangeIncludes(event) {
//     let pk = event.target.value;
//     let associatedObjectPk = includesData[pk]['associatedObject'];
//     if (!associatedObjectPk) {
//         // pass
//     } else if (event.target.checked) {
//         addToIncludedObjectPks(associatedObjectPk);
//         updateAttributes();
//     } else {
//         removeFromIncludedObjectPks(associatedObjectPk);
//         updateAttributes();
//     };
// }