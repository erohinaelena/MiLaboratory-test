import React, {useEffect, useRef} from 'react';
import {scaleLinear} from 'd3-scale';
import {select} from 'd3-selection';
import {axisBottom, axisLeft} from "d3-axis";

const MARGINS = {
    TOP: 20,
    BOTTOM: 20,
    LEFT: 40,
    RIGHT: 40,
};
const WIDTH = 1100;
const HEIGHT = 500;
const OUTER_WIDTH = WIDTH + MARGINS.LEFT + MARGINS.RIGHT;
const OUTER_HEIGHT = HEIGHT + MARGINS.TOP + MARGINS.BOTTOM;

interface HistogramProps {
    data: number[];
    minX: number;
    maxX: number;
    maxY: number;
}

export default function Histogram({data, minX, maxX, maxY}: HistogramProps) {
    const columnnsRef = useRef<SVGGElement>(null);
    const xAxisRef = useRef<SVGGElement>(null);
    const yAxisRef = useRef<SVGGElement>(null);
    useEffect(() => {
        const scaleX = scaleLinear().domain([minX, maxX]).range([0, WIDTH]);
        const scaleY = scaleLinear().domain([0, maxY]).range([HEIGHT, 0]).nice();
        const step = WIDTH / data.length;
        const rects = select(columnnsRef.current)
            .selectAll('rect')
            .data(data);
        rects
            .enter()
            .append('rect')
            .merge(rects)
            .attr('x', (_d, i) => i * step)
            .attr('y', d => scaleY(d))
            .attr('width', step)
            .attr('height', d => HEIGHT - scaleY(d))
        rects
            .exit()
            .remove()

        select(xAxisRef.current).call(axisBottom(scaleX).tickSizeOuter(0))
        select(yAxisRef.current).call(axisLeft(scaleY).tickSizeOuter(0))
    }, [data, minX, maxX, maxY]);
    return (
        <svg viewBox={`0 0 ${OUTER_WIDTH} ${OUTER_HEIGHT}`} width={OUTER_WIDTH} height={OUTER_HEIGHT}>
            <g ref={columnnsRef} transform={`translate(${MARGINS.LEFT},${MARGINS.TOP})`} fill="#38a988" stroke="white" strokeWidth="0.5" />
            <g ref={xAxisRef} transform={`translate(${MARGINS.LEFT},${MARGINS.TOP + HEIGHT})`}/>
            <g ref={yAxisRef} transform={`translate(${MARGINS.LEFT},${MARGINS.TOP})`}/>
        </svg>
    );
}
