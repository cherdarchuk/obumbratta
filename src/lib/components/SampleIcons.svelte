<script>
  import BoatIcon from  '~icons/mdi/sail-boat-sink';
  import TubeIcon from  '~icons/mdi/test-tube';
  import FireIcon from  '~icons/mdi/fire';
</script>

<div class="ui-box">
  <div class="icon-set">
    <div class="icon-item">
      <div class="icon-box">
        <BoatIcon color="var(--viz-12)" />
      </div>
      <div class="icon-text">
        <div class="icon-title">A bigger boat</div>
        <div class="icon-num">123,456</div>
      </div>
    </div>
    <div class="icon-item">
      <div class="icon-box">
        <TubeIcon color="var(--viz-12)" />
      </div>
      <div class="icon-text">
        <div class="icon-title">Yippee-ki-yay</div>
        <div class="icon-num">789,012</div>
      </div>
    </div>
    <div class="icon-item">
      <div class="icon-box">
        <FireIcon color="var(--viz-12)" />
      </div>
      <div class="icon-text">
        <div class="icon-title">Fire, Chef</div>
        <div class="icon-num">345,678</div>
      </div>
    </div>
    <div class="small-print">*objects are closer than they appear</div>
  </div>
</div>

<style>
  .ui-box {
    /* border: 1px solid var(--grey-50); */
    border-radius: 10px;
    box-shadow: 0 0 0 1px var(--grey-50), 0 10px 15px -3px rgba(0, 0, 0, .05), 0 4px 6px -4px rgba(0, 0, 0, .05);
    height: 200px;
    width: 175px
  }

  .icon-set {
    display: flex;
    flex-direction: column;
    gap: 16px;
    justify-content: center;
    background-color: var(--viz-6);
    padding: 16px;
    height: 100%;
    border-radius: 10px;
  }

  .icon-item {
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 12px;
  }
  .icon-box {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--viz-4);
    border-radius: 8px;
  }
  .small-print {
    font-size: 7px;
    color: var(--viz-20);
    margin-top: -6px;
  }

  .icon-title {
    font-size: 12px;
    color: var(--viz-18);
  }
  .icon-num {
    font-size: 18px;
    font-weight: 700;
    color: white;
  }

</style>