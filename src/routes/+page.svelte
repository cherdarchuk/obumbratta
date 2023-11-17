
<script>
  import copy from '/src/data/text.json';
  import Scrolly from '../components/helpers/Scrolly.svelte';
  import Stats from '../components/Stats.svelte';

  let scrollIndex = 0;
  $: curProj = updateProj(scrollIndex); 
  
  function updateProj (i) {
    return copy.projects[i];
  }
  
  $: console.log(scrollIndex);
  $: console.log(curProj);
</script>
  
<div class="container">  
  <div class="obumbratta">{copy.obumbratta}</div>
  <h3>{copy.tagline}</h3>

  <div class="break"></div>
  <h1>{@html copy.intro}</h1>
  <div class="break"></div>

  {#if scrollIndex !== undefined}
    <section id="projects">
      <h2>Projects</h2>

      <div class="scrolly">
        <div class="sticky">
          <div class="details">
            <div class="client">{curProj.client}</div>
            <div class="name">{curProj.name}</div>
            <Stats label="Analysis" value={+curProj.analysis} />
            <Stats label="Design" value={+curProj.design} />
            <Stats label="Code" value={+curProj.code} />
          </div>
          <div class="ratio">
            <div class="numer">{scrollIndex + 1}</div>
            <svg class="slash" width="112" height="295" viewBox="0 0 112 295" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M99 1H111L13 294H1L99 1Z" fill="#333333"/>
              <path d="M111 1V294H13L111 1Z" fill="#EEEDE6"/>
            </svg>
            <div class="denom">of {copy.projects.length}</div>
          </div>
        </div>
            
        <div class="scrolling">
          <Scrolly bind:value={scrollIndex}>
              {#each copy.projects as proj, i}
                <div class='step' class:active={scrollIndex === i} data-index={i}>
                  {#if proj.collab} <div class="collab">{@html proj.collab}</div> {/if}
                  <div class="video"><img src=/images/{proj.video}/></div>

                  <div class="descrip">
                    <div class="text">{@html proj.description}</div>
                    {#if proj.badge} 
                      <div class="badge"><img src="images/{proj.badge}" alt={proj.badge_alt}/></div>
                    {/if}
                  </div> 
                  <a class="proj-link" href={proj.link} target="_blank">
                      <svg height="24" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 10L4 0H8L4 10H0Z" fill="var(--highlight-colour)"/>
                      </svg> 
                      <div>{proj.link_text}</div>
                  </a>
                </div>
              {/each}
          </Scrolly>
        </div>
      </div>
          
    </section>	
  {/if}
  
  
  <section>
    <h2>Contact</h2>
    <p>Contact</p>
    <p>Info</p>
    <p>Here</p>

  </section>

</div>


<style>
  .container {
    max-width: 1600px;
    margin: 70px auto 40px;
    padding: 0 40px;
  }

  h1 {
    text-align: center;
    font-size: 3.75rem;
    max-width: 800px;
    margin: auto;
  }

  h2, .obumbratta {
    text-align: center;
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    display: table;
    margin: auto;
    padding: 8px 6px 4px 10px;
    border-radius: 3px ;
    background-color: var(--back-colour-a70);
  }

  h2 {
    position: sticky;
    top: 70px;
    margin-bottom: 3rem;
  }


  h3 {
    text-align: center;
    font-size: 1rem;
    color: var(--grey-600);
  }

  .break {
    margin: 2.5rem auto;
    width: 2rem;
    border-bottom: 1px solid var(--brown-400);
  }


  /* Scrolly formatting */

  .scrolly {
		display: flex;
	}

  .sticky {
    position: sticky;
    /* top: 15rem;
    width: 50%; */
    display: flex;
    justify-content: space-between;


    width: 100%;
    height: 50vh;
    margin: 0;
    top: 25vh;
    left: 0;
  }

  .scrolling {
    width: 100%;

  }
  .step {
    min-height: 70vh;
    max-width: 500px;
    margin-left: auto;
  }


  /* Project and Stats */

  .details {
    margin-top: 4rem;
  }

  .client {
    font-size: 0.875rem;
    color: var(--highlight-colour);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 0.25rem;
  }
  .name {
    font-size: 1.25rem;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }



  /* Ratio Counter */

  .ratio {
    width: 200px;
  }

  .numer {
    position: absolute;
    margin-top: 25px;
    color: var(--back-colour);
    text-shadow:  1px 1px 0 var(--highlight-colour), -1px 1px 0 var(--highlight-colour), -1px -1px 0 var(--highlight-colour), 1px -1px 0 var(--highlight-colour);
    font-family: 'Open Sans', sans-serif;
    font-size: 12.5rem;
    font-weight: bold;
  }
  .slash {
    position: absolute;
    margin-left: 2rem
  }
  .denom {
    position: absolute;
    margin-top: 200px;
    margin-left: 5.5rem;

  }


  /* Project info */
  .collab {
    text-align: right;
    font-size: 0.625rem;
    font-family: 'Open Sans', sans-serif;
    margin-bottom: 5px;
  }
  .video img {
    border-radius: 4px;
    opacity: 0.8;
    transition: opacity 1s;
  }
  .video img:hover {
    opacity: 1;
  }
  .descrip {
    display: flex;
    gap: 20px;
    margin-top: 1rem;
  }
  .text {
    font-size: 1.25rem;
    line-height: 1.3em;
  }
  .badge {
    flex-shrink: 0;
  }

  .proj-link {
    display: flex;
    justify-content: right;
    align-items: center;
    gap: 6px;
    margin-top: 1rem;
  }



</style>