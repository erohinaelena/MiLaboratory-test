import {getArrayFromFileData} from './data';

addEventListener('message', (event: MessageEvent<string>) => {
	postMessage(getArrayFromFileData(event.data));
})
