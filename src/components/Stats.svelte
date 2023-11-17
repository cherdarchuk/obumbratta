<script>
  export let label = 'Analysis';
	export let value = 5;
</script>


<div class="stat">
  <div class="label">{label}</div>
  <div class="pipe">|</div>
  <div class="bars">
   {#each {length: value} as _, i}
      <svg width="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 10L4 0H8L4 10H0Z" fill="var(--highlight-colour)"/>
      </svg>    
    {/each}
  </div>
</div>


<style>
  .stat {
    display: flex;
    gap: 20px;
    align-items: center;
    margin-bottom: 4px;
  }
  .label {
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.875rem;
    width: 66px;
  }
  .pipe{
    text-align: center;
    color: var(--highlight-colour);
    /* height: 100%; */
    /* border-left: 1px solid var(--highlight-colour); */
  }

</style>