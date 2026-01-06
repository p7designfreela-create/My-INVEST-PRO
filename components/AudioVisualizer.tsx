
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface AudioVisualizerProps {
  isListening: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isListening }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 300;
    const height = 150;
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll("*").remove();

    const n = 20;
    const data = d3.range(n).map(() => 5 + Math.random() * 20);

    const x = d3.scaleBand()
      .domain(d3.range(n).map(String))
      .range([0, width])
      .padding(0.2);

    const bars = svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(String(i)) || 0)
      .attr("y", d => (height - d) / 2)
      .attr("width", x.bandwidth())
      .attr("height", d => d)
      .attr("fill", "#6366f1")
      .attr("rx", 4);

    let animationId: number;

    const update = () => {
      bars.transition()
        .duration(200)
        .attr("y", d => {
          const val = isListening ? (5 + Math.random() * 80) : (5 + Math.random() * 10);
          return (height - val) / 2;
        })
        .attr("height", d => {
          return isListening ? (5 + Math.random() * 80) : (5 + Math.random() * 10);
        })
        .on("end", update);
    };

    update();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isListening]);

  return (
    <div className="flex justify-center items-center py-8">
      <svg ref={svgRef} className="rounded-xl bg-gray-900/50 p-4 border border-indigo-500/30" />
    </div>
  );
};
