<script>
  import { onMount, onDestroy } from 'svelte';
	import MultiLineChart from './MultiLineChart.svelte';

  let numbers = $state([0.1, 0.15, 0.2, 0.25, 0.3, 0.28, 0.35, 0.4, 0.38, 0.45, 0.5, 0.55, 0.6, 0.58, 0.65, 0.7, 0.75, 0.8, 0.78, 0.85]);

  let interval;

  onMount(() => {
    interval = setInterval(() => {
      // Random walk: more variability, less chance of hitting 0 or 1
      const prev = numbers[numbers.length - 1];
      let step = (Math.random() - 0.5) * 0.4; // step between -0.125 and 0.125
      // Add bias to keep away from 0 and 1
      const biasStrength = 0.4;
      if (prev < 0.2) step += biasStrength;
      if (prev > 0.8) step -= biasStrength;
      let next = prev + step;
      next = Math.max(0, Math.min(1, next));
      numbers = [...numbers.slice(1), next];
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });

</script>

<div class="ui-box">
  <div class="trend-set">
    <div class="chart-title">Are we trendin'?</div>
    <div class="chart-subtitle">All your base are belong to us</div>
    <div style:height="140px">
      <MultiLineChart
        data={numbers}
        yDomain={[0, 1]}
        padding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        colors={['var(--viz-12)']}
        showXAxis={false}
        showYAxis={false}
        showArea={true}
      />
    </div>
  </div>
</div>

<style>
  .ui-box {
    /* border: 1px solid var(--grey-50); */
    border-radius: 10px;
    box-shadow: 0 0 0 1px var(--grey-50), 0 10px 15px -3px rgba(0, 0, 0, .05), 0 4px 6px -4px rgba(0, 0, 0, .05);
    height: 200px;
  }

  .trend-set {
    display: block;
    align-items: center;
    justify-content: start;
    gap: 12px;
    justify-content: start;
    background-color: white;
    padding: 16px;
    height: 100%;
    border-radius: 10px;
    width: 330px;
  }
  .chart-title {
    font-size: 24px;
    line-height: 90%;
    font-weight: 900;
    letter-spacing: -7%;
    color: var(--viz-17);
    text-transform: uppercase;
  }

  .chart-subtitle {
    font-size: 12px;
    color: var(--viz-10);
  }


</style>