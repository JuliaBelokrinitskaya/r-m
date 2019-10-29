const CHARACTER_URL = `https://rickandmortyapi.com/api/character/`;
let characters = [];
let width = window.innerWidth;
let height = window.innerHeight;
let id = 1;

const getCharacter = ({name, image, location}) => ({
  id: id++,
  name,
  image,
  location: location.name,
  value: 1
});

function getHierarchy(items, property) {
  let data = {
    name: ``,
    children: []
  };

  d3.group(items, item => item[property]).forEach((val, key) => {
    data.children.push({
      name: key,
      children: val
    });
  });

  return d3.hierarchy(data)
    .sum(item => item.value)
    .sort((item1, item2) => item2.value - item1.value);
}

function pack(items, property) {
  return d3.pack()
    .size([width, height])
    .padding(10)
    (getHierarchy(items, property));
}

const getPage = (url, n) => {
  return fetch(`${url}?page=${n}`)
    .then(res => res.json())
    .then(res => {
      characters = characters.concat(res.results)
    })
};

const getAllCharacters = (url) => {
  let fetches = [];

  fetch(url)
    .then(res => res.json())
    .then(res => {
      for (let i = 1; i <= res.info.pages; i++) {
        fetches.push(getPage(url, i))
      }

      Promise.all(fetches).then(function() {
        characters = characters.map(character => getCharacter(character));

        const root = pack(characters, `location`);
        let focus = root;
        let view;

        const color = d3.scaleLinear()
          .domain([0, 5])
          .range([`hsl(152,80%,80%)`, `hsl(228,30%,40%)`])
          .interpolate(d3.interpolateHcl)

        const svg = d3.create(`svg`)
          .classed(`circle-pack`, true)
          .attr(`viewBox`, `-${width / 2} -${height / 2} ${width} ${height}`)
          .on(`click`, () => zoom(root));

        const box = svg.append(`g`);

        const groups = box
          .selectAll(`g`)
          .data(root.descendants().slice(1))
          .join(`g`)
            .attr(`pointer-events`, d => !d.children ? `none` : null)
            .on(`mouseover`, function() { d3.select(this).attr(`stroke`, `#ffffff`); })
            .on(`mouseout`, function() { d3.select(this).attr(`stroke`, null); })
            .on(`click`, d => focus !== d && (zoom(d), d3.event.stopPropagation()));

        const circles = groups.filter(d => !d.data.id)
          .append(`circle`)
          .attr(`fill`, d => color(d.depth + Math.random()))

        const clipPaths = groups.filter(d => d.data.id)
          .append(`clipPath`)
            .attr(`id`, d => `circle-${d.data.id}`)
            .append(`circle`)

        const images = groups.filter(d => d.data.id)
          .append(`image`)
            .attr(`clip-path`, d => `url(#circle-${d.data.id})`)
            .attr(`xlink:href`, d => d.data.image)

        const label = svg.append(`g`)
          .style(`font`, `10px sans-serif`)
          .attr(`pointer-events`, `none`)
          .attr(`text-anchor`, `middle`)
          .selectAll(`text`)
          .data(root.descendants())
          .join(`text`)
            .style(`fill-opacity`, d => d.parent === root ? 1 : 0)
            .style(`display`, d => d.parent === root ? `inline` : `none`)
            .text(d => d.data.name);

        zoomTo([root.x, root.y, root.r * 2]);

        function zoomTo(v) {
          const k = Math.min(width, height) / v[2];
          view = v;
          label.attr(`transform`, d => `translate(${(d.x - v[0]) * k},${(d.y - v[1] + (d.data.id ? d.r / 2 : 0)) * k})`);
          groups.attr(`transform`, d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
          circles.attr(`r`, d => d.r * k);
          clipPaths.attr(`r`, d => d.r * k);
          clipPaths.attr(`cx`, d => d.r * k);
          clipPaths.attr(`cy`, d => d.r * k);
          images.attr(`transform`, d => `translate(${(- d.r) * k},${(- d.r) * k})`);
          images.attr(`width`, d => d.r * k * 2);
          images.attr(`height`, d => d.r * k * 2);
        }

        function zoom(d) {
          const focus0 = focus;
          focus = d;

          const transition = svg.transition()
              .duration(d3.event.altKey ? 7500 : 750)
              .tween(`zoom`, d => {
                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                return t => zoomTo(i(t));
              });

          label
            .filter(function(d) { return d.parent === focus || this.style.display === `inline`; })
            .transition(transition)
              .style(`fill-opacity`, d => d.parent === focus ? 1 : 0)
              .on(`start`, function(d) { if (d.parent === focus) this.style.display = `inline`; })
              .on(`end`, function(d) { if (d.parent !== focus) this.style.display = `none`; });
        }

        document.body.appendChild(svg.node());

        window.addEventListener(`resize`, () => {
          width = window.innerWidth;
          height = window.innerHeight;

          svg.attr(`viewBox`, `-${width / 2} -${height / 2} ${width} ${height}`);

          zoomTo([root.x, root.y, root.r * 2]);
        })
      });
    })
};

getAllCharacters(CHARACTER_URL);
