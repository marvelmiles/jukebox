//eslint-disable-next-line
export default () => {
  // eslint-disable-next-line no-restricted-globals
  self.onmessage = ({ data: { arr, query } }) => {
    let valid = false;
    for (let item of arr) {
      if (item.id === query || item === query) {
        valid = true;
        break;
      }
    }
    postMessage(valid);
  };
};
