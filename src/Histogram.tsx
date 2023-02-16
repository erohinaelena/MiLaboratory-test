import React, {useEffect, useRef, useState} from 'react';
import {scaleLinear, scaleLog} from 'd3-scale';
import {select} from 'd3-selection';
import {axisBottom, axisLeft} from 'd3-axis';

const MARGINS = {
    TOP: 20,
    BOTTOM: 20,
    LEFT: 60,
    RIGHT: 40,
};
const WIDTH = 1100;
const HEIGHT = 500;
const OUTER_WIDTH = WIDTH + MARGINS.LEFT + MARGINS.RIGHT;
const OUTER_HEIGHT = HEIGHT + MARGINS.TOP + MARGINS.BOTTOM;
const HISTOGRAM_COLOR = '#38a988';

interface HistogramProps {
    data: number[][];
    minX: number;
    maxX: number;
    maxY: number[];
}
type scaleXType = 'linear' | 'log';

export default function Histogram({data, minX, maxX, maxY}: HistogramProps) {
    const columnsRef = useRef<SVGGElement>(null);
    const xAxisRef = useRef<SVGGElement>(null);
    const yAxisRef = useRef<SVGGElement>(null);
    const [scaleXType, setScaleXType] = useState<scaleXType>('linear');
    useEffect(() => {
        const getValueByXType = (data: number[]) => data[scaleXType === 'linear' ? 0 : 1];
        const scaleX = (scaleXType === 'linear' ? scaleLinear() : scaleLog()).domain([minX, maxX]).range([0, WIDTH]);
        const scaleY = scaleLinear()
            .domain([0, getValueByXType(maxY)])
            .range([HEIGHT, 0])
            .nice();
        const step = WIDTH / data.length;
        const rects = select(columnsRef.current).selectAll<SVGRectElement, number[]>('rect').data(data);
        rects
            .enter()
            .append('rect')
            .merge(rects)
            .attr('x', (_d, i) => i * step)
            .attr('y', d => scaleY(getValueByXType(d)))
            .attr('width', step)
            .attr('height', d => HEIGHT - scaleY(getValueByXType(d)));
        rects.exit().remove();

        if (xAxisRef.current && yAxisRef.current) {
            select(xAxisRef.current).call(axisBottom(scaleX).tickSizeOuter(0));
            select(yAxisRef.current).call(axisLeft(scaleY).tickSizeOuter(0));
        }
    }, [data, minX, maxX, maxY, scaleXType]);
    return (
        <div style={{position: 'relative', display: 'inline-block'}}>
            <svg viewBox={`0 0 ${OUTER_WIDTH} ${OUTER_HEIGHT}`} width={OUTER_WIDTH} height={OUTER_HEIGHT}>
                <g
                    ref={columnsRef}
                    transform={`translate(${MARGINS.LEFT},${MARGINS.TOP})`}
                    fill={HISTOGRAM_COLOR}
                    stroke="white"
                    strokeWidth="0.5"
                />
                <g ref={xAxisRef} transform={`translate(${MARGINS.LEFT},${MARGINS.TOP + HEIGHT})`} />
                <g ref={yAxisRef} transform={`translate(${MARGINS.LEFT},${MARGINS.TOP})`} />
            </svg>
            <div style={{position: 'absolute', top: '100%', right: '20px'}}>
                <input
                    type="radio"
                    name="axisX"
                    value="linear"
                    defaultChecked
                    onChange={e => {setScaleXType(e.target.value as scaleXType);}}
                /> linear
                <input
                    type="radio"
                    name="axisX"
                    value="log"
                    onChange={e => {setScaleXType(e.target.value as scaleXType);}}
                /> log
            </div>
        </div>
    );
}
