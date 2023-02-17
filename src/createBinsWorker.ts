import {createBins} from "./data";

addEventListener('message', (event: MessageEvent<{arr:number[],nbins:number}>) => {
    postMessage(createBins(event.data.arr, event.data.nbins));
})
