import React, {useEffect, useRef, useState} from 'react';
import {scaleLinear, scaleLog} from 'd3-scale';
import {select} from 'd3-selection';
import {axisBottom, axisLeft} from 'd3-axis';
import 'd3-transition';

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
const DURATION = 500;

interface HistogramProps {
    data: number[][];
    minX: number;
    maxX: number;
    maxY: number[];
}
type scaleXType = 'linear' | 'log';

export default function Histogram({data, minX, maxX, maxY}: HistogramProps) {
    const columnsRef = useRef<SVGGElement>(null);
    const gridRef = useRef<SVGGElement>(null);
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
        const rectsCount = data.length;
        const step = WIDTH / rectsCount;
        const rects = select(columnsRef.current)
            .selectAll<SVGRectElement, number[]>('rect')
            .data(data, (_d, i) => `${rectsCount}_${i}`);
        rects
            .enter()
            .append('rect')
            .merge(rects)
            .attr('x', (_d, i) => i * step)
            .attr('y', 0)
            .attr('width', step)
            .transition().duration(DURATION)
            .attr('height', d => HEIGHT - scaleY(getValueByXType(d)));
        rects.exit().remove();

        if (xAxisRef.current && yAxisRef.current && gridRef.current) {
            const axisX = axisBottom(scaleX).tickSizeOuter(0);
            const axisY = axisLeft(scaleY).tickSizeOuter(0);
            const axisGrid = axisLeft(scaleY).tickSize(-WIDTH).tickFormat('');
            select(xAxisRef.current).transition().duration(DURATION).call(axisX);
            select(yAxisRef.current).transition().duration(DURATION).call(axisY);
            select(gridRef.current).transition().duration(DURATION).call(axisGrid);
        }
    }, [data, minX, maxX, maxY, scaleXType]);
    return (
        <div style={{position: 'relative', display: 'inline-block'}}>
            <svg viewBox={`0 0 ${OUTER_WIDTH} ${OUTER_HEIGHT}`} width={OUTER_WIDTH} height={OUTER_HEIGHT}>
                <g
                    className="ChartGrid"
                    ref={gridRef}
                    transform={`translate(${MARGINS.LEFT},${MARGINS.TOP})`}
                    opacity={0.2}
                    strokeWidth={0.5}
                />
                <g
                    ref={columnsRef}
                    transform={`translate(${MARGINS.LEFT},${MARGINS.TOP + HEIGHT}) scale(1,-1)`}
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
                    onChange={e => {
                        setScaleXType(e.target.value as scaleXType);
                    }}
                />{' '}
                linear
                <input
                    type="radio"
                    name="axisX"
                    value="log"
                    onChange={e => {
                        setScaleXType(e.target.value as scaleXType);
                    }}
                />{' '}
                log
            </div>
        </div>
    );
}
