<script>
  import BoatIcon from  '~icons/mdi/sail-boat-sink';
  import TubeIcon from  '~icons/mdi/test-tube';
  import FireIcon from  '~icons/mdi/fire';
</script>

<div class="ui-box">
  <div class="chonk-set">
    <div class="chonk-image">
      <div class="chonk-image-overlay"></div>

    </div>
    <div class="chonk-text">
      <div class="chonk-title">Dat Boy Chonky</div>
      <div class="chonk-desc">Squish Squirrel squashes the garbage down with his squasher-downer.</div>
      <div class="chonk-desc"><i>– Richard Scarry<br>   (adapted)</i></div>
    </div>
  </div>
</div>

<style>
  .ui-box {
    /* border: 1px solid var(--grey-50); */
    border-radius: 10px;
    box-shadow: 0 0 0 1px var(--app-50), 0 10px 15px -3px rgba(0, 0, 0, .05), 0 4px 6px -4px rgba(0, 0, 0, .05);
    height: 200px;
  }

  .chonk-set {
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 12px;
    justify-content: start;
    background-color: var(--viz-2);
    padding: 12px;
    height: 100%;
    border-radius: 10px;
  }
  .chonk-image {
    width: 140px;
    height: 178px;
    background-color: var(--viz-10);
    border-radius: 8px;
    background-image: url('/images/squirrel.png');
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
  }
  .chonk-image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--viz-10);
    opacity: 0.2;
    pointer-events: none;
    border-radius: 8px;
  }
  .chonk-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    height: 100%;
    gap: 8px;
    width: 98px;
  }

  .chonk-title {
    font-size: 24px;
    line-height: 90%;
    font-weight: 900;
    letter-spacing: -7%;
    color: var(--viz-15);
    text-transform: uppercase;
  }
  .chonk-desc {
    font-size: 10px;
    color: var(--viz-18);
    width: 85%;
  }

</style>