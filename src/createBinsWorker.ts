import {createBinsOnSortedArray} from './data';

addEventListener('message', (event: MessageEvent<{arr: number[]; nbins: number}>) => {
    postMessage(createBinsOnSortedArray(event.data.arr, event.data.nbins));
});
