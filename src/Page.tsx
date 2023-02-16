import React, {useCallback, useState} from 'react';
import Controls from './Controls';
import Histogram from './Histogram';

export default () => {
    const [counts, setCounts] = useState<number[][]>([]);
    const [maxY, setMaxY] = useState<number[]>([0,0]);
    const [minX, setMinX] = useState<number>(0);
    const [maxX, setMaxX] = useState<number>(0);

    const onDataUpdate = useCallback(
        (nextData: {
            data: number[][];
            minX: number;
            maxX: number;
            maxY: number[];
        }) => {
            setCounts(nextData.data);
            setMaxY(nextData.maxY);
            setMinX(nextData.minX);
            setMaxX(nextData.maxX)
        },
        []
    );
    return (
        <div>
            <Controls onDataUpdate={onDataUpdate} />
            <Histogram data={counts} maxY={maxY} minX={minX} maxX={maxX} />
        </div>
    );
};
