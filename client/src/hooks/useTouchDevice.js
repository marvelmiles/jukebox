import { useEffect, useState } from "react";
//eslint-disable-next-line import/no-anonymous-default-export
export default () => {
  const detectTouch = () =>
    window.matchMedia("(max-width:1024px)").matches ||
    ((/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.platform)) &&
      "ontouchstart" in window &&
      (navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0 ||
        ("matchMedia" in window &&
          window.matchMedia("(pointer:coarse)").matches)));
  //test whether css pointer corse feature is present
  // if it is we know th device is running on a touch screen

  const [isTouchDevice, setIsTouchDevice] = useState(detectTouch());
  useEffect(() => {
    const onResize = () => {
      setIsTouchDevice(detectTouch());
    };
    window.addEventListener("resize", onResize, false);
    return () => window.removeEventListener("resize", onResize, false);
  });
  return { isTouchDevice };
};
