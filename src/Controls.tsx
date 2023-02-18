import React, {useCallback, useEffect, useRef} from 'react';
import lodash from 'lodash';
import styles from './styles.module.css';
import {generateSampleForLinear, generateSampleForLog} from "./data";

const MAX_NBINS = 1000;
const MIN_NBINS = 0;
const DEFAULT_NBINS = 100;

interface ControlsProps {
    onDataUpdate: (nextData: {data: number[][]; minX: number; maxX: number; maxY: number[]}) => void;
    onPendingChange: (pending:boolean) => void;
}

export default function Controls({onDataUpdate, onPendingChange}: ControlsProps) {
    const arrRef = useRef<number[]>([]);
    const nbinsRef = useRef<number>(DEFAULT_NBINS);
    const workerReadingFileRef = useRef<Worker>();
    const workerCreatingBinsRef = useRef<Worker>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingCounterRef = useRef(0)

    const getArrayFromFile = useCallback(async (data:string) => {
        workerReadingFileRef.current?.postMessage(data);
        pendingCounterRef.current++;
        onPendingChange(pendingCounterRef.current !== 0);
    }, []);
    const createBins = useCallback(async () => {
        workerCreatingBinsRef.current?.postMessage({arr: arrRef.current, nbins: nbinsRef.current});
        pendingCounterRef.current++;
        onPendingChange(pendingCounterRef.current !== 0);
    }, [])
    const resetFileInput = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [])
    const onInputChange = useCallback(lodash.debounce(
        e => {
            const nextNBins = lodash.clamp(Number(e.target.value), MIN_NBINS, MAX_NBINS);
            if (isFinite(nextNBins)) {
                nbinsRef.current = nextNBins
                createBins();
            }
        }, 200
    ), [])

    useEffect(() => {
        workerReadingFileRef.current = new Worker(new URL('./getArrayFromFileWorker.ts', import.meta.url))
        workerCreatingBinsRef.current = new Worker(new URL('./createBinsWorker.ts', import.meta.url))

        workerReadingFileRef.current.onmessage = (event: MessageEvent<number[]>) => {
            arrRef.current = event.data;
            pendingCounterRef.current--;
            createBins();
        }
        workerCreatingBinsRef.current.onmessage = (event) => {
            onDataUpdate(event.data);
            pendingCounterRef.current--;
            onPendingChange(pendingCounterRef.current !== 0);
        }
        return () => {
            workerReadingFileRef.current?.terminate();
            workerCreatingBinsRef.current?.terminate();
        }
    }, [])

    return (
        <div className={styles.controls}>
            <span className={styles.control}>
                <span className={styles.label}>NBINS:</span>
                <input
                    defaultValue={DEFAULT_NBINS}
                    type="number"
                    max={MAX_NBINS}
                    min={MIN_NBINS}
                    onChange={onInputChange}
                />
            </span>
            <span className={styles.control}>
                <span className={styles.label}>ARRAY:</span>
                <input
                    ref={fileInputRef}
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
                        arrRef.current = generateSampleForLinear();
                        createBins();
                        resetFileInput();
                    }}
                >
                    Generate sample input (linear)
                </button>
            </span>
            <span className={styles.control}>
                <button
                    onClick={() => {
                        arrRef.current = generateSampleForLog();
                        createBins();
                        resetFileInput();
                    }}
                >
                    Generate sample input (log)
                </button>
            </span>
        </div>
    );
}
