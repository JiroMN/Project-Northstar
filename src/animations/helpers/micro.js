// !Exclude from compile
// Disappear
export function disappearToTop($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { yPercent: 0, filter: "blur(0px)", autoAlpha: 1 },
      { yPercent: -50, filter: "blur(5px)", autoAlpha: 0, ...$props }
    );
}
export function disappearToRight($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { xPercent: 0, filter: "blur(0px)", autoAlpha: 1 },
      { xPercent: 50, filter: "blur(5px)", autoAlpha: 0, ...$props }
    );
}

// Appear
export function appearFromBottom($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { yPercent: 50, filter: "blur(5px)", autoAlpha: 0 },
      { yPercent: 0, filter: "blur(0px)", autoAlpha: 1, ...$props }
    );
}
export function appearFromRight($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { xPercent: 50, filter: "blur(5px)", autoAlpha: 0 },
      { xPercent: 0, filter: "blur(0px)", autoAlpha: 1, ...$props }
    );
}
