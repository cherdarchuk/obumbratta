<script>
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { linear } from 'svelte/easing';

	// define and set the initial tweening function
	let sweep = tweened(parseInt((Date.now() / 1000) % 60), {
		duration: 1000,
		easing: linear
	});

	let time = new Date();
	// for a smooth transition between 59 and 0 seconds
	let start = Date.now() / 1000 - (Date.now() / 1000) % 60

	// these automatically update when `time`
	// changes, because of the `$:` prefix
	$: hours = time.getHours();
	$: minutes = time.getMinutes();
	$: seconds = time.getSeconds();



	onMount(() => {
		const interval = setInterval(() => {
			time = new Date();
			sweep.set(parseInt(Date.now() / 1000 - start));
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});
</script>


<div class="ui-box">
  <div class="clock-set">
  	<svg viewBox='-50 -50 100 100'>

  		<circle class='clock-face' r='48'/>


  		<!-- markers -->
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

  		<!-- hour hand -->
  		<line
  					class='hour'
  					y1='6'
  					y2='-28'
  					transform='rotate({30 * hours + minutes / 2})'
  					/>

  		<!-- minute hand -->
  		<line
  					class='minute'
  					y1='6'
  					y2='-42'
  					transform='rotate({6 * minutes + seconds / 10})'
  					/>

  		<!-- second hand -->
  		<g transform='rotate({6 * $sweep})'>
  			<line class='second' y1='10' y2='-36'/>
  		</g>

  		<!-- pivot -->
  		<circle class='fulcrum' r='1.25' />

  	</svg>	
  </div>
</div>  


<style>
  
  .ui-box {
    border-radius: 10px;
    box-shadow: 0 0 0 1px var(--grey-50), 0 10px 15px -3px rgba(0, 0, 0, .05), 0 4px 6px -4px rgba(0, 0, 0, .05);
    height: 200px;
  }

  .clock-set {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: start;
    gap: 12px;
    background-color: var(--viz-2);
    padding: 12px;
    height: 100%;
    border-radius: 10px;
  }

  svg {
    width: 140px;
    height: 140px;
  }


	.clock-text {
    fill: var(--viz-18);
		font-size: 0.7em;
	}

	.clock-face {
		stroke: var(--viz-4);
    fill: var(--viz-1);
	}

	.fulcrum {
		fill: var(--viz-10);
	}

	.minor {
		stroke: var(--viz-4);
		stroke-width: 0.5;
	}

	.major {
		stroke: var(--viz-6);
		stroke-width: 1;
	}

	.hour {
		stroke: var(--viz-18);
		stroke-linecap: round;
		stroke-width: 1.5;
	}

	.minute {
		stroke: var(--viz-15);
		stroke-linecap: round;
		stroke-width: 1;
	}

	.second {
		stroke: var(--viz-10);
		stroke-width: 0.5;
	}

	.second {
		stroke: var(viz-10);
	}

</style>
