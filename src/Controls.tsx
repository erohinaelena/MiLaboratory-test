import React, {useState} from 'react';
import {min as d3Min, max as d3Max} from 'd3-array';
import lodash from 'lodash';
import {scaleQuantize, scaleLog, scaleThreshold, scaleLinear} from 'd3-scale';
import {randomInt, randomNormal} from 'd3-random';
import styles from './styles.module.css';

const MAX_NBINS = 1000;
const MIN_NBINS = 0;
const DEFAULT_NBINS = 100;

interface ControlsProps {
    onDataUpdate: (nextData: {data: number[][]; minX: number; maxX: number; maxY: number[]}) => void;
}

function getDataArray(rawData: string) {
    return rawData
        .split('\n')
        .map(el => parseInt(el))
        .filter(isFinite);
}

// Сопоставляет точкам из набора Х точки, которые на графике отображаются там же, но в лог.координатах
function linearToLog(domainLinear: number[], domainLog: number[], xArr: number[]) {
    const testLinear = scaleLinear().domain(domainLinear).range([0, 1000]);
    const testLog = scaleLog().domain(domainLog).range([0, 1000]);
    return xArr.map((x: number) => testLog.invert(testLinear(x)));
}

function createBins(arr: number[], nbins: number) {
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

function generateSampleForLinear() {
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

function generateSampleForLog() {
    const linearSample = generateSampleForLinear().sort((a, b) => a - b);
    const min = d3Min(linearSample) as number;
    const max = d3Max(linearSample) as number;
    return linearToLog([min, max], [1, Math.pow(max, 2)], linearSample);
}

export default function Controls({onDataUpdate}: ControlsProps) {
    const [array, setArray] = useState<number[]>([]);
    const [nbins, setNBins] = useState<number>(DEFAULT_NBINS);

    return (
        <div>
            <span className={styles.control}>
                <span className={styles.label}>NBINS:</span>
                <input
                    defaultValue={nbins.toString()}
                    type="number"
                    max={MAX_NBINS}
                    min={MIN_NBINS}
                    onChange={e => {
                        const nextNBins = lodash.clamp(Number(e.target.value), MIN_NBINS, MAX_NBINS);
                        if (isFinite(nextNBins)) {
                            setNBins(nextNBins);
                            onDataUpdate(createBins(array, nextNBins));
                        }
                    }}
                />
            </span>
            <span className={styles.control}>
                <span className={styles.label}>ARRAY:</span>
                <input
                    type="file"
                    accept=".txt"
                    onChange={e => {
                        const file = e?.target?.files?.[0];
                        if (!file) {
                            return;
                        }
                        const reader = new FileReader();
                        reader.readAsText(file, 'UTF-8');
                        reader.onload = readerEvent => {
                            const content = readerEvent?.target?.result as string;
                            const nextArray = getDataArray(content);
                            setArray(nextArray);
                            onDataUpdate(createBins(nextArray, nbins));
                        };
                    }}
                />
            </span>
            <span className={styles.control}>
                <button
                    onClick={() => {
                        const nextArray = generateSampleForLinear();
                        setArray(nextArray);
                        onDataUpdate(createBins(nextArray, nbins));
                    }}
                >
                    Generate sample input (linear)
                </button>
            </span>
            <span className={styles.control}>
                <button
                    onClick={() => {
                        const nextArray = generateSampleForLog();
                        setArray(nextArray);
                        onDataUpdate(createBins(nextArray, nbins));
                    }}
                >
                    Generate sample input (log)
                </button>
            </span>
        </div>
    );
}
