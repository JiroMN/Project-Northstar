const screenSizeScreen = $(".screen-size");
const BREAKPOINT_WIDTH = 1000;
const BREAKPOINT_HEIGHT = 750;

function handleScreenSizeNotice() {
  if (
    window.innerWidth < BREAKPOINT_WIDTH ||
    window.innerHeight < BREAKPOINT_HEIGHT
  ) {
    screenSizeScreen.css("display", "flex");
  } else {
    screenSizeScreen.css("display", "none");
  }
}

handleScreenSizeNotice();

$(window).on("resize", handleScreenSizeNotice);
