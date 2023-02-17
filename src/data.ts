import {scaleLinear, scaleLog, scaleQuantize, scaleThreshold} from "d3-scale";
import {max as d3Max, min as d3Min} from "d3-array";
import lodash from "lodash";
import {randomInt, randomNormal} from "d3-random";

function linearToLog(domainLinear: number[], domainLog: number[], xArr: number[]) {
    const testLinear = scaleLinear().domain(domainLinear).range([0, 1000]);
    const testLog = scaleLog().domain(domainLog).range([0, 1000]);
    return xArr.map((x: number) => testLog.invert(testLinear(x)));
}

export function createBins(arr: number[], nbins: number) {
    if (arr.length === 0 || nbins === 0) {
        return {
            data: [],
            minX: 0,
            maxX: 0,
            maxY: [0, 0],
        };
    }
    const minX = d3Min(arr) as number;
    const maxX = d3Max(arr) as number;
    if (minX === maxX) {
        return {
            data: [[arr.length, arr.length]],
            minX: (arr[0] - 0.1) as number,
            maxX: (arr[0] + 0.1) as number,
            maxY: [arr.length, arr.length],
        };
    }
    const counts = lodash.range(0, nbins).map(() => [0, 0]);
    const binsRange = lodash.range(0, nbins);
    const stepLinear = (maxX - minX) / nbins;
    const domainLinear = [minX, maxX];
    const domainLog = linearToLog(
        domainLinear,
        domainLinear,
        lodash.range(minX + stepLinear, minX + nbins * stepLinear, stepLinear)
    );

    const scaleForLinearBins = scaleQuantize().domain(domainLinear).range(binsRange);
    const scaleForLogBins = scaleThreshold().domain(domainLog).range(binsRange);

    arr.forEach((el: number) => {
        counts[scaleForLinearBins(el)][0]++;
        counts[scaleForLogBins(el)][1]++;
    });

    return {
        data: counts,
        minX,
        maxX,
        maxY: [d3Max(counts, ([n1]) => n1) as number, d3Max(counts, ([, n2]) => n2) as number],
    };
}

export function generateSampleForLinear() {
    const len = randomInt(1000, 10000)();
    const mu = randomInt(100, 1000)();
    const sigma = randomInt(100, 200)();
    let arr = Array.from({length: len}, randomNormal(mu, sigma));
    const min = d3Min(arr) as number;
    if (min < 1) {
        const shift = Math.ceil(1 - min);
        arr = arr.map(el => el + shift);
    }
    return arr;
}

export function generateSampleForLog() {
    const linearSample = generateSampleForLinear().sort((a, b) => a - b);
    const min = d3Min(linearSample) as number;
    const max = d3Max(linearSample) as number;
    return linearToLog([min, max], [1, Math.pow(max, 2)], linearSample);
}

export function getArrayFromFileData(str:string) {
    return str
        .split('\n')
        .map(el => parseInt(el))
        .filter(isFinite)
}
