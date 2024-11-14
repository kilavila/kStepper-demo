import kStepper from "../kStepper/kStepper.js";

const ks = new kStepper();

setTimeout(() => {
  ks.showHints();
  ks.startWalkthrough();
}, 500);
