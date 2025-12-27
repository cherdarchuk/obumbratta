<script>
  import { onMount } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { linear } from 'svelte/easing';
  import Topography from '$lib/assets/topography.svg';

  // 1. Use $state for reactive variables
  let time = $state(new Date());

  // 2. Use $derived for values that depend on state
  let hours = $derived(time.getHours());
  let minutes = $derived(time.getMinutes());
  let seconds = $derived(time.getSeconds());

  // Define start point for the smooth sweep logic
  const start = Date.now() / 1000 - (Date.now() / 1000) % 60;

  // 3. Use the new Tween class (replaces 'tweened' store)
  // Access value with `sweep.current` and set with `sweep.target = ...`
  let sweep = new Tween(parseInt((Date.now() / 1000) % 60), {
    duration: 1000,
    easing: linear
  });

  onMount(() => {
    const interval = setInterval(() => {
      // Direct assignment triggers reactivity in Svelte 5
      time = new Date();
      
      // Update the tween target
      sweep.target = parseInt(Date.now() / 1000 - start);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="ui-box">
  <div class="topography" >
    <Topography />
  </div>
  <div class="clock-set">
    <svg viewBox='-50 -50 100 100'>

      <circle class='clock-face' r='48'/>

      {#each [0.00001, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}
        <line
              class='major'
              y1='41'
              y2='45'
              transform='rotate({30 * minute})'
        />

        <g transform='rotate({ (minute / 5 - 6) * 6 * (minute / (minute/5)) })'>
          <text 
                class="clock-text"
                transform='rotate({ ((minute / 5 - 6) * 6 * (minute / (minute/5))) * -1 },0,{ 35 + (1 - (Math.abs((minute/5-6)*6*(minute/(minute/5))) * Math.PI / 180) / Math.PI) })' 
                text-anchor='middle' 
                y='{40 + (Math.abs((minute / 5 - 6) * 6 * ( minute / ( minute / 5))) * Math.PI / 180) / Math.PI - 1}'
          >
            {minute===0.00001 ? 12 : minute / 5}
          </text>
        </g>
      
        {#each [1, 2, 3, 4] as offset}
          <line
                class='minor'
                y1='42'
                y2='45'
                transform='rotate({6 * (minute + offset)})'
                />
        {/each}
      {/each}

      <line
            class='hour'
            y1='6'
            y2='-28'
            transform='rotate({30 * hours + minutes / 2})'
            />

      <line
            class='minute'
            y1='6'
            y2='-42'
            transform='rotate({6 * minutes + seconds / 10})'
            />

      <g transform='rotate({6 * sweep.current})'>
        <line class='second' y1='10' y2='-36'/>
      </g>

      <circle class='fulcrum' r='1.25' />

    </svg>  
    <div class="clock-time">{time.toLocaleTimeString()}</div>
  </div>
</div>  

<style>
  .ui-box {
    border-radius: 10px;
    box-shadow: 0 0 0 1px var(--app-50), 0 10px 15px -3px rgba(0, 0, 0, .05), 0 4px 6px -4px rgba(0, 0, 0, .05);
    height: 200px;
    overflow: hidden;
    position: relative;
    background-color: var(--viz-1);
  }

  .clock-set {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: start;
    gap: 12px;
    padding: 12px;
    height: 100%;
    border-radius: 10px;
    position: relative;
    z-index: 1;
  }

  .topography {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    user-select: none;
    color: var(--viz-6);
    z-index: 0;
  }  

  svg {
    width: 140px;
    height: 140px;
  }

  .clock-text {
    fill: var(--viz-18);
    font-size: 0.7em;
  }

  .clock-time {
    font-size: 18px;
    font-weight: 900;
    color: var(--viz-20);
  } 

  .clock-face {
    stroke: var(--viz-4);
    fill: var(--viz-1);
  }

  .fulcrum {
    fill: var(--viz-10);
  }

  .minor {
    stroke: var(--viz-7);
    stroke-width: 0.5;
  }

  .major {
    stroke: var(--viz-9);
    stroke-width: 1;
  }

  .hour {
    stroke: var(--viz-18);
    stroke-linecap: round;
    stroke-width: 3;
  }

  .minute {
    stroke: var(--viz-15);
    stroke-linecap: round;
    stroke-width: 1.5;
  }

  .second {
    stroke: var(--viz-10);
    stroke-width: 1;
  }
</style>