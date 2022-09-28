//eslint-disable-next-line
export default () => {
  // eslint-disable-next-line no-restricted-globals
  self.onmessage = ({ data: { arr, by } }) => {
    switch (by) {
      // a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      case "alphabetical":
        return postMessage(
          arr
            .slice()
            .sort((a, b) =>
              new Intl.Collator("en", {
                sensitivity: "accent",
              }).compare(a.title || a.name, b.title || b.name)
            )
            .reduce((r, e) => {
              // get first letter of name of current element
              let group = (e.title || e.name)[0];
              // if there is no property in accumulator with this letter create it
              if (!r[group]) r[group] = [e];
              // if there is push current element to children array for that letter
              else r[group].push(e);
              // return accumulator
              return r;
            }, {})
        );
      case "Release Year":
        return postMessage(
          arr
            .slice()
            .sort((a, b) => (a.year === b.year ? 0 : a.year > b.year ? 1 : -1))
        );
      case "Artist":
        postMessage(
          arr.slice().sort((a, b) =>
            new Intl.Collator("en", {
              sensitivity: "accent",
            }).compare(a.artist, b.artist)
          )
        );
        break;
      default:
        postMessage(
          arr
            .slice()
            .sort((a, b) =>
              a.uploadedAt === b.uploadedAt
                ? 0
                : a.uploadedAt > b.uploadedAt
                ? 1
                : -1
            )
            .reduce((r, e) => {
              // get first letter of name of current element
              let group = e.plays || "24";
              // if there is no property in accumulator with this letter create it
              if (!r[group]) r[group] = [e];
              // if there is push current element to children array for that letter
              else r[group].push(e);
              // return accumulator
              return r;
            }, {})
        );
        break;
    }
  };
};
