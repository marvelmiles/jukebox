export const createStringFn = (fn) => {
  if (typeof fn === "string") {
    let args = fn.indexOf("=>");
    args =
      args >= 0
        ? fn.substring(0, fn.indexOf("=>"))
        : fn.substring(args + 1, fn.indexOf(")"));
    // eslint-disable-next-line-no-new-func
    return new Function(
      args,
      fn.substring(fn.indexOf("{") + 1, fn.lastIndexOf("}"))
    );
  }
  return fn;
};
