<script>

	const { 
    values = [0,50,100],
    min = 0,
    max = 100,
    size = 100
  } = $props();

  let lineLength = $derived(values.length > 0 ? 100 / (values.length) : 5);





</script>

<svg width={size} height={200} viewBox="0 0 100, 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <rect x="0" y="0" width="100" height="100" fill="#eee" />
  {#each values as value, i}

    {@const prevValue = i > 0 ? values[i - 1] : 0}
    <line 
      y1={100 - (value - min) / (max - min) * 100} 
      x1={i * lineLength} 
      y2={100 - (value - min) / (max - min) * 100} 
      x2={(i + 1) * lineLength}
      stroke="black" 
      stroke-width="1"
    />
    {#if i > 0}
      <line 
        y1={100 - (prevValue - min) / (max - min) * 100} 
        x1={i * lineLength} 
        y2={100 - (value - min) / (max - min) * 100} 
        x2={i * lineLength} 
        stroke="grey" 
        stroke-width="0.5"
      />
    {/if}
  {/each}
</svg>