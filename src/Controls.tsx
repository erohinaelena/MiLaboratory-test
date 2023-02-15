import React, {useState} from 'react';
import {min as d3Min, max as d3Max} from 'd3-array';
import lodash from 'lodash';
import {scaleQuantize} from 'd3-scale';
import styles from './styles.module.css';

const MAX_NBINS = 1000;
const MIN_NBINS = 0;
const DEFAULT_NBINS = 10;

interface ControlsProps {
    onDataUpdate: (nextData: {data: number[]; minX: number; maxX: number; maxY: number}) => void;
}

function getDataArray(rawData: string) {
    return rawData.split('\n').map((el) => parseInt(el)).filter(isFinite);
}

function createBins(arr: number[], nbins: number) {
    if (arr.length === 0 || nbins === 0) {
        return {
            data: [],
            minX: 0,
            maxX: 0,
            maxY: 0,
        };
    }
    const minX = d3Min(arr) as number;
    const maxX = d3Max(arr) as number;
    if (minX === maxX) {
        return {
            data: [arr.length],
            minX: (arr[0] - 0.1) as number,
            maxX: (arr[0] + 0.1) as number,
            maxY: arr.length as number,
        };
    }
    const counts = new Array(nbins).fill(0);
    const scale = scaleQuantize().domain([minX, maxX]).range(lodash.range(0, nbins));
    arr.forEach((el: number) => {
        counts[scale(el)]++;
    });
    return {
        data: counts,
        minX,
        maxX,
        maxY: d3Max(counts) as number,
    };
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
        </div>
    );
}
