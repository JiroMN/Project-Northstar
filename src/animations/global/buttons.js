$(".button").each(function () {
  const $btn = $(this);

  const tl = gsap.timeline({ paused: true }).to($btn, {
    autoAlpha: 0.65,
    duration: 0.75,
    ease: "power1.out",
  });

  $btn.on("mouseenter", function () {
    gsap.to(tl, { duration: tl.duration(), time: tl.duration() });
  });

  $btn.on("mouseleave", function () {
    gsap.to(tl, { duration: tl.duration(), time: 0 });
  });
});
