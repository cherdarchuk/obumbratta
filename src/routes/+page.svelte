
<script>
  import copy from '/src/data/text.json';
  import Scrolly from '../components/helpers/Scrolly.svelte';
  import Stats from '../components/Stats.svelte';
  import mq from '../stores/mq.js'; 

  let scrollIndex = 0;
  $: curProj = updateProj(scrollIndex); 
  
  function updateProj (i) {
    return copy.projects[i];
  }
  
  $: console.log(scrollIndex);
  $: console.log(curProj);
</script>
  
<div class="container {$mq.classNames}">  
  <div class="obumbratta">{copy.obumbratta}</div>
  <h3>{copy.tagline}</h3>

  <div class="break"></div>
  <h1>{@html copy.intro}</h1>
  <div class="break"></div>

  {#if scrollIndex !== undefined}
    <section id="projects">
      <h2 class="{$mq.classNames}">Projects</h2>

      {#if !$mq.mobile}
        <div class="scrolly">
          <div class="sticky" class:mobile={$mq.tablet}>
            <div class="details">
              <div class="client">{curProj.client}</div>
              <div class="name">{curProj.name}</div>
              <Stats label="Analysis" value={+curProj.analysis} />
              <Stats label="Design" value={+curProj.design} />
              <Stats label="Code" value={+curProj.code} />
            </div>
            <div class="ratio">
              <div class="numer">{scrollIndex + 1}</div>
              <svg class="slash" viewBox="0 0 112 295" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      {:else}
        {#each copy.projects as proj, i}
          <div class="mobile">
            <div class="mobile-details">
              <div class="details">
                <div class="client">{proj.client}</div>
                <div class="name">{proj.name}</div>
                <Stats label="Analysis" value={+proj.analysis} />
                <Stats label="Design" value={+proj.design} />
                <Stats label="Code" value={+proj.code} />
              </div>
              <div class="ratio">
                <div class="numer">{i+1}</div>
                <svg class="slash" viewBox="0 0 112 295" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M99 1H111L13 294H1L99 1Z" fill="#333333"/>
                  <path d="M111 1V294H13L111 1Z" fill="#EEEDE6"/>
                </svg>
                <div class="denom">of {copy.projects.length}</div>
              </div>
            </div>

            <div class="active proj-section">
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
          </div>
          <div class="break"></div>
        {/each}
      {/if}
          
    </section>	
  {/if}
  
  
  <section>
    <h2>Contact</h2>
    <div class='contacts'>
      <div class='contact-cta'> I create clear and engaging visual tools. Get in touch if you'd like to collaborate.</div>
      <div class='contact-points'>
        <div><a target="_blank" href="mailto:joey@obumbratta.com">
          <svg role="img"  width="16" viewBox="0 0 1200 1200" xmlns="http://www.w3.org/2000/svg"><g>
            <path fill="#766c2b" d="m218 288.5 298.5 207 48 33.5c21.5 15.5 49.5 15.5 71 0.5l62-43 284.5-198 48.5-33.5 24-17c-22.5-16-50-25.5-79.5-25.5h-750c-29.5 0-57 9.5-79.5 25.5l47.051 32.648z"/>           
            <path fill="#766c2b"  d="m1073 317-21.148 14.75-261.35 181.25-112 78c-23.5 16.5-51 24.5-78.5 24.5s-55-8-78.5-25l-82.5-57-289.65-200.9-22.352-15.602-29-20c-7 16-10.5 34-10.5 53v500c0 76 61.5 137.5 137.5 137.5h750c76 0 137.5-61.5 137.5-137.5v-500c0-19-3.5-37-10.5-53z"/>          
          </g></svg>
          joey@obumbratta.com
        </a></div>
        <div><a target="_blank" href="https://bsky.app/profile/obumbratta.com">
          <svg width="16" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill="#766c2b" d="M110.976 62.336C169.696 106.4 232.832 195.776 256 243.712C279.2 195.776 342.304 106.432 401.024 62.336C443.36 30.56 512 5.95198 512 84.224C512 99.872 503.04 215.584 497.792 234.368C479.488 299.648 412.896 316.32 353.664 306.24C457.216 323.872 483.584 382.24 426.656 440.64C318.624 551.488 271.392 412.8 259.296 377.28C257.056 370.752 256 367.68 256 370.304C256 367.712 254.944 370.752 252.736 377.28C240.608 412.8 193.376 551.488 85.344 440.64C28.448 382.24 54.784 323.84 158.304 306.24C99.104 316.32 32.48 299.68 14.208 234.368C8.96 215.584 0 99.84 0 84.224C0 5.95198 68.64 30.56 110.976 62.336Z"/>
          </svg>  
          @obumbratta.com
        </a></div>
        <div><a target="_blank" href="https://www.linkedin.com/in/joey-cherdarchuk/">
          <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16"><path fill="#766c2b" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>
          joey-cherdarchuk
        </a></div>
          
      </div>
    </div>

  </section>

</div>


<style>
  .container {
    max-width: 1600px;
    margin: 70px auto 40px;
    padding: 0 40px;
  }
  .mq-mobile.container {
    padding: 0 24px;
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

  h2.mq-mobile{
    position: relative;
    top: 0;
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

  .mobile.sticky{
    flex-direction: column;
    justify-content: flex-start;

  }

  .scrolling {
    width: 100%;

  }
  .step {
    min-height: 70vh;
    max-width: 500px;
    margin-left: auto;
  }

  .mobile .proj-section {
    margin-bottom: 3rem;
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

  .mobile .details{
     margin-top: 1rem;
     margin-bottom: 1rem;
  }

  /* Ratio Counter */

  .ratio {
    width: 185px;
  }

  .numer {
    position: absolute;
    color: var(--back-colour);
    text-shadow:  1px 1px 0 var(--highlight-colour), -1px 1px 0 var(--highlight-colour), -1px -1px 0 var(--highlight-colour), 1px -1px 0 var(--highlight-colour);
    font-family: var(--open);
    font-size: 12.5rem;
    font-weight: bold;
  }
  .slash {
    position: absolute;
    margin-left: 2rem;
    width: 100px;
  }
  .denom {
    position: absolute;
    margin-top: 180px;
    margin-left: 5rem;
    font-weight: bold;
  }


  .mobile .ratio{
    width: 78px;
  }
  .mobile .numer{
    margin-top: 10px;
    font-size: 6rem;
  }
  .mobile .slash {
    margin-left: 1rem;
    width: 60px;
    height: 138px;
  }
  .mobile .denom{
    margin-top: 88px;
    margin-left: 3rem;
  }


  /* Project info */
  .collab {
    text-align: right;
    font-size: 0.625rem;
    font-family: var(--open);
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
  .mobile .text{
    font-size: 1rem;;
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
  	font-size: 1rem;
  	letter-spacing: 0.05em;
  	text-transform: uppercase;
  }

  .mobile-details {
    display: flex;
    justify-content: space-between;
  }


  /* Contact Info */
  .contacts {
    margin-top: -25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin-bottom: 5rem;
  }

  .contact-cta {
    width: 180px;
    font-family: var(--sans);
    font-size: 0.875rem;
    line-height: 1.4rem;

  }
  .contact-points {
    width: 180px;
  }
  .contact-points a {
    display: flex;
    align-items: center;
    line-height: 1.4rem;
    gap: 8px;
    font-family: var(--sans);
    font-size: 0.875rem;
  }


</style>