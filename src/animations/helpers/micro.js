// !Exclude from compile
// Disappear
export function disappearToTop($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { yPercent: 0, filter: "blur(0px)", autoAlpha: 1 },
      { yPercent: -50, filter: "blur(5px)", autoAlpha: 0, ...$props },
    );
}
export function disappearToRight($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { xPercent: 0, filter: "blur(0px)", autoAlpha: 1 },
      { xPercent: 50, filter: "blur(5px)", autoAlpha: 0, ...$props },
    );
}
export function disappear($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { filter: "blur(0px)", autoAlpha: 1 },
      { filter: "blur(5px)", autoAlpha: 0, ...$props },
    );
}
export function growOut($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { filter: "blur(0px)", autoAlpha: 1, scale: 1 },
      { filter: "blur(5px)", autoAlpha: 0, scale: 0.98, ...$props },
    );
}

// Appear
export function appearFromTop($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { yPercent: -50, filter: "blur(5px)", autoAlpha: 0 },
      { yPercent: 0, filter: "blur(0px)", autoAlpha: 1, ...$props },
    );
}
export function appearFromBottom($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { yPercent: 50, filter: "blur(5px)", autoAlpha: 0 },
      { yPercent: 0, filter: "blur(0px)", autoAlpha: 1, ...$props },
    );
}
export function appearFromRight($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { xPercent: 50, filter: "blur(5px)", autoAlpha: 0 },
      { xPercent: 0, filter: "blur(0px)", autoAlpha: 1, ...$props },
    );
}
export function appear($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { filter: "blur(5px)", autoAlpha: 0 },
      { filter: "blur(0px)", autoAlpha: 1, ...$props },
    );
}

export function growIn($elem, $props) {
  return gsap
    .timeline()
    .fromTo(
      $elem,
      { filter: "blur(5px)", autoAlpha: 0, scale: 0.98 },
      { filter: "blur(0px)", autoAlpha: 1, scale: 1, ...$props },
    );
}
