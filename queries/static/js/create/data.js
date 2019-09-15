import elements from './elements.js';

const endpoints = {
	objects: elements.primaryObject.dataset.endpoint,
};

const dataFromApi = {};

export async function getObjectData(pk) {
	const dataId = `object_${pk}`;
	if (dataId in dataFromApi) {
		return dataFromApi[dataId];
	} else {
		const response = await fetch(endpoints.objects + pk);
		const json = await response.json();
		dataFromApi[dataId] = json;
		return json;
	}
}
