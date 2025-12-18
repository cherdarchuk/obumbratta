<script>
	import '$lib/styles/normalize.css';
	import '$lib/styles/app.css';
</script>


<div class="full-width">
  <div class="header">
    <!-- <div><a href="#home">Home</a></div> -->
    <div></div>
    <svg width="57" height="36" viewBox="0 0 57 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M39 1H25L13.48 35.2H27.48L39 1Z" fill="#BDB897"/>
      <path d="M57 1H43L31.48 35.2H45.48L57 1Z" fill="#BDB897"/>
    </svg>
    <nav class="menu">
      <!-- <a href="#projects">Projects</a>
      <a href="#about">About</a> -->
    </nav>
  </div>
</div>


<slot></slot>


<div class="full-width-foot">
  <div class="footer">
      <div></div>
      <div>Joey Cherdarchuk</div>
      <a target="_blank" href="mailto:joey@obumbratta.com">joey@obumbratta.com</a>
      <div></div>
  </div>
</div>

<style>
  .full-width {
    position: sticky;
    top: 0;
    width: 100%;
    z-index: 10;
    background-color: var(--back-colour);
  }
  .header {
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between ;
    align-items: center;
    height: 70px;
    max-width: 1600px;
    margin: auto;
    padding: 0 40px;
    width: 100%;
    z-index: 2;
    background-color: var(--back-colour);
  }
  nav {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 30px;
    min-width: 20px; 
    /* may have to change this and the width below if you add back a nav menu*/
  }
  .header div {
    min-width: 20px
  }
  


  .full-width-foot {
    position: fixed;
    bottom: 0px;
    width: 100%;
    background-color: var(--grey-800);
    z-index: 99;
  }
  .footer {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 40px;
    font-family: var(--open);
  }
  .footer a, .footer div{
    color: var(--brown-100);
    font-size: 0.75rem;
    letter-spacing: normal;
    text-transform: none;
  }

</style>
