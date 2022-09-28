//eslint-disable-next-line
export default () => {
  // eslint-disable-next-line no-restricted-globals
  self.onmessage = ({ data: { list, callback, ...rest } }) => {
    const validItems = [];
    const inValidItems = [];
    for (let item in list) {
      if (callback) {
        // eslint-disable-next-line no-new-func
        if (new Function(callback.args, callback.body)(list[item], item, rest))
          validItems.push(list[item]);
        else inValidItems.push(list[item]);
      } else validItems.push(list[item]);
    }
    postMessage({ validItems, inValidItems });
  };
};
