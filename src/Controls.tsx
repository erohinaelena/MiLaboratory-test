import React, {useCallback, useEffect, useRef, useState} from 'react';
import lodash from 'lodash';
import styles from './styles.module.css';
import {generateSampleForLinear, generateSampleForLog} from "./data";

const MAX_NBINS = 1000;
const MIN_NBINS = 0;
const DEFAULT_NBINS = 100;

interface ControlsProps {
    onDataUpdate: (nextData: {data: number[][]; minX: number; maxX: number; maxY: number[]}) => void;
}

export default function Controls({onDataUpdate}: ControlsProps) {
    const [arr, setArr] = useState<number[]>([]);
    const [nbins, setNBins] = useState<number>(DEFAULT_NBINS);
    const workerReadingFileRef = useRef<Worker>()
    const workerCreatingBinsRef = useRef<Worker>()

    const getArrayFromFile = useCallback(async (data:string) => {
        workerReadingFileRef.current?.postMessage(data)
    }, []);
    const createBins = useCallback(async (a: number[], n:number) => {
        workerCreatingBinsRef.current?.postMessage({arr: a, nbins: n})
    }, [])

    useEffect(() => {
        workerReadingFileRef.current = new Worker(new URL('./getArrayFromFileWorker.ts', import.meta.url))
        workerCreatingBinsRef.current = new Worker(new URL('./createBinsWorker.ts', import.meta.url))

        workerReadingFileRef.current.onmessage = (event: MessageEvent<number[]>) => {
            const nextArray = event.data;
            setArr(nextArray);
            createBins(nextArray, nbins);
        }
        workerCreatingBinsRef.current.onmessage = (event) => {
            onDataUpdate(event.data);
        }
        return () => {
            workerReadingFileRef.current?.terminate();
            workerCreatingBinsRef.current?.terminate();
        }
    }, [])

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
                            createBins(arr, nextNBins);
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
                            getArrayFromFile(content);
                        };
                    }}
                />
            </span>
            <span className={styles.control}>
                <button
                    onClick={() => {
                        const nextArray = generateSampleForLinear();
                        setArr(nextArray);
                        createBins(nextArray, nbins);
                    }}
                >
                    Generate sample input (linear)
                </button>
            </span>
            <span className={styles.control}>
                <button
                    onClick={() => {
                        const nextArray = generateSampleForLog();
                        setArr(nextArray);
                        createBins(nextArray, nbins);
                    }}
                >
                    Generate sample input (log)
                </button>
            </span>
        </div>
    );
}
