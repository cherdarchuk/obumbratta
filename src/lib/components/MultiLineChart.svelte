<script>
	import { scaleLinear } from 'd3';
	import { line, area, curveMonotoneX, curveStepAfter } from 'd3';
	import { extent, group } from 'd3';

	let {
		data = [],
		x = 'x',
		y = 'y',
		series = () => 'default',
		xDomain = undefined,
		yDomain = undefined,
		colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
		padding = { top: 20, right: 20, bottom: 20, left: 40 },
    indexed = false,
    showXAxis = true,
    showYAxis = true,
    title = '',
    curve = 'monotoneX',
    showArea = false,
	} = $props();

	// Container dimensions state
	let width = $state(0);
	let height = $state(0);

	// Helpers to normalize accessors (handle string key vs function)
	const getX = (d) => (typeof x === 'function' ? x(d) : d[x]);
	const getY = (d) => (typeof y === 'function' ? y(d) : d[y]);
	const getSeries = (d) => (typeof series === 'function' ? series(d) : d[series]);
  const curveMapping = {
    monotoneX: curveMonotoneX,
    stepAfter: curveStepAfter
  };

	// Create indexed data if required
	const processedData = $derived.by(() => {
		let normalizedData = data;
		// If data is an array of numbers, convert to array of objects
		if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
			normalizedData = data.map((d, i) => ({ x: i, y: d }));
		}

		if (!indexed) return normalizedData;

		const indexedResult = [];
		const grouped = group(normalizedData, getSeries);

		for (const [key, values] of grouped) {
			if (values.length === 0) continue;

			// Find the first data point by sorting by the x-accessor
			const sortedValues = [...values].sort((a, b) => getX(a) - getX(b));
			const firstValue = getY(sortedValues[0]);

			if (firstValue === 0) {
				// If the base is 0, we can't calculate a percentage change.
				// We'll map all values for this series to an indexed value of 0.
				indexedResult.push(...sortedValues.map(d => ({ ...d, [y]: 0 })));
			} else {
				indexedResult.push(
					...sortedValues.map(d => ({
						...d,
						[y]: getY(d) / firstValue - 1
					}))
				);
			}
		}
		return indexedResult;
	});

	// 1. Group Data by Series
	const groupedData = $derived(group(processedData, getSeries));

	// 2. Calculate Domains
	const calculatedXDomain = $derived.by(() => {
		if (xDomain) return xDomain;
		const domain = extent(processedData, getX);
		return [domain[0] || 0, domain[1] || 1];
	});

	const calculatedYDomain = $derived.by(() => {
		if (yDomain) return yDomain;
		const domain = extent(processedData, getY);
		// Add 10% headroom to Y axis
		return [domain[0] || 0, (domain[1] || 1) * 1.1];
	});

	// 3. Create Scales
	const xScale = $derived(
		scaleLinear()
			.domain(calculatedXDomain)
			.range([padding.left, width - padding.right])
	);

	const yScale = $derived(
		scaleLinear()
			.domain(calculatedYDomain)
			.range([height - padding.bottom, padding.top])
	);

	// Helper to get color for a series
	const getColorForSeries = (seriesKey, fallbackIndex) => {
		// Check if colors is an array of objects with series/color properties
		if (colors.length > 0 && typeof colors[0] === 'object' && colors[0].series !== undefined) {
			const colorObj = colors.find((c) => c.series === seriesKey);
			return colorObj?.color || '#ff0000'; // Default to red if not found
		}
		// Otherwise, colors is a simple array
		return colors[fallbackIndex % colors.length];
	};

	// 4. Create Line Generator
	const lineGenerator = $derived(
		line()
			.x((d) => xScale(getX(d)))
			.y((d) => yScale(getY(d)))
			.curve(curveMapping[curve] || curveMonotoneX)
	);

  const areaGenerator = $derived(
    area()
      .x((d) => xScale(getX(d)))
      .y0((d) => yScale(0))
      .y1((d) => yScale(getY(d)))
			.curve(curveMapping[curve] || curveMonotoneX)
  );

	// 5. Generate Path Data
	const seriesPaths = $derived.by(() => {
		const result = [];
		let index = 0;

		for (const [key, values] of groupedData) {
			const d = lineGenerator(values);
			if (d) {
				result.push({
					id: key,
					path: d,
					color: getColorForSeries(key, index)
				});
			}
			index++;
		}
		return result;
	});

	// Simple derived state for ticks
	const xTicks = $derived(xScale.ticks(5));
	const yTicks = $derived(yScale.ticks(5));

	const formatYTicks = (tick) => {
		if (!indexed) return tick;
		return `${(tick * 100).toFixed(0)}%`;
	}
</script>

<div class="chart-container" bind:clientWidth={width} bind:clientHeight={height}>
	{#if width > 0 && height > 0}
		<svg {width} {height} viewBox="0 0 {width} {height}">
			{#if showArea}
				<defs>
					{#each Array.from(groupedData.entries()) as [key, values], i}
						<linearGradient id="area-gradient-{i}" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0%" stop-color={getColorForSeries(key, i)} stop-opacity="1" />
							<stop offset="100%" stop-color={getColorForSeries(key, i)} stop-opacity="0.1" />
						</linearGradient>
					{/each}
				</defs>
			{/if}
      {#if title}
        <text 
          x={width / 2} 
          y={Math.max(padding.top / 2, 16)} 
          text-anchor="middle" 
          font-size="12" 
          fill="#77777799" 
        >
          {title}
        </text>
      {/if}

			{#if showYAxis}
  			<g class="axis y-axis">
  				{#each yTicks as tick}
  					<g transform="translate(0, {yScale(tick)})">
  						<line x1={padding.left} x2={width - padding.right} stroke="#77777722" stroke-dasharray="3" />
  						<text
  							x={Math.max(padding.left - 5, 1)}
  							y={-3}
  							text-anchor="start"
  							font-size="10"
  							fill="#77777777"
  						>
  							{formatYTicks(tick)}
  						</text>
  					</g>
  				{/each}
  			</g>
      {/if}            


			{#if showXAxis}
  			<g class="axis x-axis">
  				{#each xTicks as tick}
  					<g transform="translate({xScale(tick)}, {height - padding.bottom})">
  						<line y1={0} y2={5} stroke="#9ca3af" />
  						<text y={18} text-anchor="middle" font-size="10" fill="#6b7280">
  							{tick}
  						</text>
  					</g>
  				{/each}
  			</g>
      {/if}

			<g class="series">
				{#if showArea}
					{#each Array.from(groupedData.entries()) as [key, values], i}
						<path
							d={areaGenerator(values)}
							fill="url(#area-gradient-{i})"
							stroke="none"
							class="area-path"
						/>
					{/each}
				{/if}
				{#each seriesPaths as series}
					<path
						d={series.path}
						fill="none"
						stroke={series.color}
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="line-path"
					/>
				{/each}
			</g>
		</svg>
	{/if}
</div>

<style>
	.chart-container {
		width: 100%;
		height: 100%;
		min-height: 10px;
		position: relative;
	}

	.line-path {
		transition: opacity 0.2s;
	}

	.line-path:hover {
		stroke-width: 3;
		opacity: 0.8;
		cursor: pointer;
	}
	.area-path {
		opacity: 0.5;
		transition: opacity 0.2s;
	}
</style>