<script>
	import '../styles/normalize.css';
	import '../styles/app.css';
</script>

<slot></slot>

<div class="full-width">
  <div class="header">
    <div><a href="#home">Home</a></div>
    <svg width="57" height="36" viewBox="0 0 57 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M39 1H25L13.48 35.2H27.48L39 1Z" fill="#BDB897"/>
      <path d="M57 1H43L31.48 35.2H45.48L57 1Z" fill="#BDB897"/>
    </svg>
    <nav class="menu">
      <a href="#projects">Projects</a>
      <a href="#about">About</a>
    </nav>
  </div>
</div>




<div class="full-width-foot">
  <div class="footer">
      <div></div>
      <div>Joey Cherdarchuk</div>
      <a href="mailto:joey@obumbratta.com">joey@obumbratta.com</a>
      <div></div>
  </div>
</div>

<style>
  .full-width {
    position: fixed;
    top: 0;
    width: 100%;
    background-color: var(--back-colour);
  }
  .header {
    display: flex;
    justify-content: space-between ;
    align-items: center;
    height: 70px;
    max-width: 1600px;
    margin: auto;
    padding: 0 40px;
    width: 100%;
  }
  nav {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 30px;
    min-width: 220px
  }
  .header div {
    min-width: 220px
  }
  


  .full-width-foot {
    position: fixed;
    bottom: 0px;
    width: 100%;
    background-color: var(--grey-800);
  }
  .footer {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 40px;
    font-family: 'Open Sans', sans-serif;
  }
  .footer a, .footer div{
    color: var(--brown-100);
    font-size: 0.75rem;
    letter-spacing: normal;
    text-transform: none;
  }
</style>
