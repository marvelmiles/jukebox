//eslint-disable-next-line
export default () => {
  // eslint-disable-next-line no-restricted-globals
  self.onmessage = ({ data: { arr, query } }) => {
    postMessage(
      arr.filter(({ title, name, artist, album }) => {
        return `${title} ${name} ${artist} ${album}`.indexOf(query) >= 0;
      })
    );
  };
};
