import {scaleLinear, scaleLog} from "d3-scale";
import {extent} from "d3-array";
import lodash from "lodash";
import {randomNormal} from "d3-random";

// "какое число стоит на месте x на графике, если поменять ось с линейной на логарифмическую"
function linearToLog(domain: number[], xArr: number[]) {
    const convertLog = scaleLog().domain(domain).range(domain);
    return xArr.map((x: number) => convertLog.invert(x));
}

// Для несортированного массива
export function createBins(arr: number[], nbins: number) {
    if (arr.length === 0 || nbins === 0) {
        return {
            data: [],
            minX: 0,
            maxX: 0,
            maxY: [0, 0],
        };
    }
    const [minX = 0, maxX = 0] = extent(arr);
    if (minX === maxX) {
        return {
            data: [[arr.length, arr.length]],
            minX: (arr[0] - 0.1) as number,
            maxX: (arr[0] + 0.1) as number,
            maxY: [arr.length, arr.length],
        };
    }
    const counts = lodash.range(0, nbins).map(() => [0, 0]);

    const stepLinear = (maxX - minX) / nbins;
    const getLinearBin = (x:number) => {
        return x === maxX ? nbins - 1 : Math.floor((x - minX) / stepLinear);
    }

    const minXLog = Math.log10(minX);
    const stepLog = (Math.log10(maxX) - Math.log10(minX)) / nbins;
    const getLogBin = (x:number) => {
        if (x === minX) {
            return 0;
        }
        if (x === maxX) {
            return nbins - 1;
        }
        return Math.floor((Math.log10(x) - minXLog) / stepLog);
    }

    let maxLinearCount = 0;
    let maxLogCount = 0;
    arr.forEach((el: number) => {
        let linearBin = getLinearBin(el);
        let logBin = getLogBin(el);
        counts[linearBin][0]++;
        counts[logBin][1]++;
        if (counts[linearBin][0] > maxLinearCount) {
            maxLinearCount = counts[linearBin][0];
        }
        if (counts[logBin][1] > maxLogCount) {
            maxLogCount = counts[logBin][1];
        }
    });

    return {
        data: counts,
        minX,
        maxX,
        maxY: [maxLinearCount, maxLogCount],
    };
}

// Для отсортированного массива
export function createBinsOnSortedArray(arr: number[], nbins: number) {
    if (arr.length === 0 || nbins === 0) {
        return {
            data: [],
            minX: 0,
            maxX: 0,
            maxY: [0, 0],
        };
    }
    const minX = arr[0];
    const maxX = arr[arr.length - 1]
    if (minX === maxX) {
        return {
            data: [[arr.length, arr.length]],
            minX: (arr[0] - 0.1) as number,
            maxX: (arr[0] + 0.1) as number,
            maxY: [arr.length, arr.length],
        };
    }
    const counts = lodash.range(0, nbins).map(() => [0, 0]);
    const stepLinear = (maxX - minX) / nbins;
    const domainLinear = [minX, maxX];
    const linearThresholds = lodash.range(1, nbins).map((el) => minX + el * stepLinear);
    const logThresholds = linearToLog(domainLinear, linearThresholds);
    linearThresholds.push(maxX);
    logThresholds.push(maxX);

    let currentBinLinear = 0;
    let currentBinLog = 0;
    let maxLinearCount = 0;
    let maxLogCount = 0;

    arr.forEach((el: number) => {
        while (el > linearThresholds[currentBinLinear]) {
            currentBinLinear++;
        }
        while (el > logThresholds[currentBinLog]) {
            currentBinLog++;
        }
        counts[currentBinLinear][0]++;
        counts[currentBinLog][1]++;
        if (counts[currentBinLinear][0] > maxLinearCount) {
            maxLinearCount = counts[currentBinLinear][0];
        }
        if (counts[currentBinLog][1] > maxLogCount) {
            maxLogCount = counts[currentBinLog][1];
        }
    });
    return {
        data: counts,
        minX,
        maxX,
        maxY: [maxLinearCount, maxLogCount],
    };
}

const SAMPLE_LEN = 10000;
const SAMPLE_RANGE = [1, 10000000];
export function generateSampleForLinear() {
    const arr = Array.from({length: SAMPLE_LEN}, randomNormal(0, 1));
    const [min = 0, max = 0] = extent(arr);
    const rangeScale = scaleLinear().domain([min, max]).range(SAMPLE_RANGE);
    return arr.map((el) => rangeScale(el)).sort((a, b) => a - b);
}

export function generateSampleForLog() {
    const linearSample = generateSampleForLinear();
    const [min = 0, max = 0] = extent(linearSample);
    return linearToLog([min, max], linearSample);
}

export function getArrayFromFileData(str:string) {
    return str
        .split('\n')
        .map(el => parseInt(el))
        .filter(isFinite)
        .sort((a, b) => a - b)
}
