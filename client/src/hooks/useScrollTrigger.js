import { useEffect, useState } from "react";
//eslint-disable-next-line import/no-anonymous-default-export
export default callback => {
    const [isFetching, setIsFetching] = useState(false);
  
    useEffect(() => {
      window.addEventListener("scroll", isScrolling);
      return () => window.removeEventListener("scroll", isScrolling);
    }, [isScrolling]);
  
    useEffect(() => {
      if (!isFetching) return;
      callback();
    }, [isFetching,callback]);
  
    function isScrolling() {
      if (
        window.innerHeight + document.documentElement.scrollTop !==
          document.documentElement.offsetHeight ||
        isFetching
      )
        return;
      setIsFetching(true);
    }
    return [isFetching, setIsFetching];
  };