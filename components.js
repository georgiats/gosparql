var component = {
  version: "0.0.1",
  debug: false
}


component.select = function(selector, type) {
  if (selector) {
    return d3.select(selector).html("").append("div").attr("class", "d3sparql " + type)
  } else {
    return d3.select("body").append("div").attr("class", "d3sparql " + type)
  }
}

/* Components */

component.htmlmap = function(json) {


  var firstColLabel = selectedRowsDimLabel()
  if (firstColLabel == "area") {

    var data = json.results.bindings
    var head = _.chain(data).map(function(o){return o.col.value}).uniq().value();

    var dataRows = d3.nest()
                     .key(function(d) { return d.row.value; })
                     .key(function(d) { return d.col.value; })
                     .rollup(function(leaves) { return leaves[0].value.value; })
                     .entries(data);

    var areaNames = _.map(dataRows, 'key')
    areaNames = _.map(areaNames, function(v){return _.replace(v,' Legal Town','')})

MQ.geocode().search(areaNames)
.on('success', function(e) {

  var results = e.result,
    html = '',
    group = [],
    features,
    marker,
    result,
    latlng,
    prop,
    best,
    val,
    map,
    r,
    i;

  map = L.map('map', {
    layers: MQ.mapLayer()
  });

  for (i = 0; i < results.length; i++) {
    result = results[i].best;
    latlng = result.latlng;
    vals = dataRows[i].values;
    // html = '<h4>' + results[i].search + '</h4>';
    // html = html + '<h2>' + val.values + '</h2>';
    // myIcon = L.divIcon({html: html});
    var myIcon = L.icon({
        iconUrl: 'marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 40],
        popupAnchor: [0, -26]
    });

    var popupText = "<b>" + results[i].search + "</b>";
    for (var x = 0; x < vals.length; x++) {
      var val = vals[x]
      popupText = popupText + '<br>'  + val.key + ': <b> ' + val.values + '</b> '
    }

    // create POI markers for each location
    marker = L.marker([ latlng.lat, latlng.lng ], {icon: myIcon})
      .bindPopup(popupText);

    if (result.adminArea1 == 'IE') {
      group.push(marker);
    }
  }

  // add POI markers to the map and zoom to the features
  features = L.featureGroup(group).addTo(map);
  map.fitBounds(features.getBounds());

});


  } //endif
}

component.htmltable = function(json, config) {
  config = config || {}

  // var head = json.head.vars
  var data = json.results.bindings
  var head = _.chain(data).map(function(o){return o.col.value}).uniq().value();
  var firstColLabel = selectedRowsDimLabel()
  if (firstColLabel == "http://purl.org/linked-data/sdmx#refArea") {
    firstColLabel = "Area"
  }
  head = _.concat(firstColLabel, head)

  var dataRows = d3.nest()
                   .key(function(d) { return d.row.value; })
                   .key(function(d) { return d.col.value; })
                   .rollup(function(leaves) { return leaves[0].value.value; })
                   .entries(data);

  var opts = {
    "selector": config.selector || null
  }

  var table = component.select(opts.selector, "htmltable").append("table")
  var thead = table.append("thead")
  var tbody = table.append("tbody")
  thead.append("tr")
    .selectAll("th")
    .data(head)
    .enter()
    .append("th")
    .text(function(col) { return col })
  var rows = tbody.selectAll("tr")
    .data(dataRows)
    .enter()
    .append("tr")
  var cells = rows.selectAll("td")
    .data(function(row) {
      return head.map(function(col,i) {
        if (i > 0) {
          return row.values[i-1].values
        } else {
          return row.key
        }
      })
    })
    .enter()
    .append("td")
    .text(function(val) { return val })

  // default CSS
  table.attr("class", "table table-bordered table-hover")
  table.style({
    "margin": "10px"
  })
  table.selectAll("th").style({
    "background": "#eeeeee",
    "text-transform": "capitalize",
  })
}

/* Rendering sparql-results+json object containing one row into a HTML select */

component.htmlselect = function(json, config, callback) {
  config = config || {}

  var head = json.head.vars
  var data = json.results.bindings

  var opts = {
    "selector": config.selector || null
  }

  var options_select = component.select(opts.selector, "htmloptionselect")

  options_select.append("select").attr("onChange", callback)
    .selectAll("option")
    .data(data)
    .enter()
    .append("option")
    .text(function(v) {
      if (v.label) {
        return v.label.value
      }
      else {
        if (v.value.value == "http://purl.org/linked-data/sdmx#refArea"){
          return "area"
        }
        else {
         return v.value.value
        }
      }
    })
    .attr("value", function(v) { return v.value.value })
}

component.htmlselectlist = function(json, config, callback) {
  config = config || {}

  var head = json.head.vars
  var data = json.results.bindings

  var data = d3.nest()
                   .key(function(d) { return d.row.value; })
                   .key(function(d) { return d.col.value; })
                   .rollup(function(leaves) { return leaves[0].value.value; })
                   .entries(data);
  data = _.reject(data, function(o) { return o.key == "all"; });

  dimKeys = _.flatMap(data[0].values, function(v){ return v.key })

  var opts = {
    "selector": config.selector || null
  }

  var options_select = component.select("#filters", "filters")

  options_select.append("select").attr("onChange", callback)
    .attr("size", dimKeys.length)
    .selectAll("option")
    .data(dimKeys)
    .enter()
    .append("option")
    .text(function(v) { return v })
    .attr("value", function(d,i) { return d + ":" + i })
}

/* Rendering sparql-results+json object into a bar chart */

component.barchart = function(json, config) {
  config = config || {}

  var data = json.results.bindings

  var head = _.chain(data).map(function(o){return o.col.value}).uniq().value();
  var firstColLabel = selectedRowsDimLabel()
  if (firstColLabel == "http://purl.org/linked-data/sdmx#refArea") {
    firstColLabel = "Area"
  }
  head = _.concat(firstColLabel, head)

  var data = d3.nest()
                   .key(function(d) { return d.row.value; })
                   .key(function(d) { return d.col.value; })
                   .rollup(function(leaves) { return leaves[0].value.value; })
                   .entries(data);
  data = _.reject(data, function(o) { return o.key == "all"; });

  var filterOption = d3.select('#filters select').node().value || "0:0";
  var  selectedFilterName = filterOption.split(":")[0]
  var  selectedFilter     = filterOption.split(":")[1]

  var opts = {
    "label_x":  config.label_x  || head[0],
    "label_y":  config.label_y  || selectedFilterName,
    "var_x":    config.var_x    || head[0],
    "var_y":    config.var_y    || head[1],
    "width":    config.width    || 750,
    "height":   config.height   || 450,
    "margin":   config.margin   || 80,  // TODO: to make use of {top: 10, right: 10, bottom: 80, left: 80}
    "selector": config.selector || null
  }

  var scale_x = d3.scale.ordinal().rangeRoundBands([0, opts.width - opts.margin], 0.1)
  var scale_y = d3.scale.linear().range([opts.height - opts.margin, 0])
  var axis_x = d3.svg.axis().scale(scale_x).orient("bottom")
  var axis_y = d3.svg.axis().scale(scale_y).orient("left")  // .ticks(10, "%")
  scale_x.domain(data.map(function(d) { return d.key }))
  scale_y.domain(d3.extent(data, function(d) { return parseInt(d.values[selectedFilter].values) }))

  var svg = component.select(opts.selector, "barchart").append("svg")
    .attr("width", opts.width)
    .attr("height", opts.height)
//    .append("g")
//    .attr("transform", "translate(" + opts.margin + "," + 0 + ")")

  var ax = svg.append("g")
    .attr("class", "axis x")
    .attr("transform", "translate(" + opts.margin + "," + (opts.height - opts.margin) + ")")
    .call(axis_x)
  var ay = svg.append("g")
    .attr("class", "axis y")
    .attr("transform", "translate(" + opts.margin + ",0)")
    .call(axis_y)
  var bar = svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("transform", "translate(" + opts.margin + "," + 0 + ")")
    .attr("class", "bar")
    .attr("x", function(d) { return scale_x(d.key) })
    .attr("width", scale_x.rangeBand())
    .attr("y", function(d) { return scale_y(d.values[selectedFilter].values) })
    .attr("height", function(d) { return opts.height - scale_y(parseInt(d.values[selectedFilter].values)) - opts.margin })
/*
    .call(function(e) {
      e.each(function(d) {
        console.log(parseInt(d[opts.var_y].value))
      })
    })
*/
  ax.selectAll("text")
    .attr("dy", ".35em")
    .attr("x", 10)
    .attr("y", 0)
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start")
  ax.append("text")
    .attr("class", "label")
    .text(opts.label_x)
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + ((opts.width - opts.margin) / 2) + "," + (opts.margin - 5) + ")")
  ay.append("text")
    .attr("class", "label")
    .text(opts.label_y)
    .style("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", 0 - (opts.height / 2))
    .attr("y", 0 - (opts.margin - 20))

  // default CSS/SVG
  bar.attr({
    "fill": "steelblue",
  })
  svg.selectAll(".axis").attr({
    "stroke": "black",
    "fill": "none",
    "shape-rendering": "crispEdges",
  })
  svg.selectAll("text").attr({
    "stroke": "none",
    "fill": "black",
    "font-size": "8pt",
    "font-family": "sans-serif",
  })
}

/* Rendering sparql-results+json object into a pie chart */

component.piechart = function(json, config) {
  config = config || {}

  var data = json.results.bindings

  var head = _.chain(data).map(function(o){return o.col.value}).uniq().value();
  var firstColLabel = selectedRowsDimLabel()
  if (firstColLabel == "http://purl.org/linked-data/sdmx#refArea") {
    firstColLabel = "Area"
  }
  head = _.concat(firstColLabel, head)

  var data = d3.nest()
                   .key(function(d) { return d.row.value; })
                   .key(function(d) { return d.col.value; })
                   .rollup(function(leaves) { return leaves[0].value.value; })
                   .entries(data);
  data = _.reject(data, function(o) { return o.key == "all" || o.key == "both"; });


  var filterOption = d3.select('#filters select').node().value || "0:0";
  var  selectedFilterName = filterOption.split(":")[0]
  var  selectedFilter     = filterOption.split(":")[1]

  var opts = {
    "label":    config.label    || head[0],
    "size":     config.size     || head[1],
    "width":    config.width    || 700,
    "height":   config.height   || 700,
    "margin":   config.margin   || 10,
    "hole":     config.hole     || 100,
    "selector": config.selector || null
  }

  var radius = Math.min(opts.width, opts.height) / 2 - opts.margin
  var hole = Math.max(Math.min(radius - 50, opts.hole), 0)
  var color = d3.scale.category20()

  var arc = d3.svg.arc()
    .outerRadius(radius)
    .innerRadius(hole)

  var pie = d3.layout.pie()
      .value(function(d) { return d.values[selectedFilter].values })

  var svg = component.select(opts.selector, "piechart").append("svg")
    .attr("width", opts.width)
    .attr("height", opts.height)
    .append("g")
    .attr("transform", "translate(" + opts.width / 2 + "," + opts.height / 2 + ")")

  var g = svg.selectAll(".arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc")
  var slice = g.append("path")
    .attr("d", arc)
    .attr("fill", function(o, i) { return color(i) })
  var text = g.append("text")
    .attr("class", "label")
    .attr("transform", function(o) { return "translate(" + arc.centroid(o) + ")" })
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text(function(o) { return o.data.key })

  // default CSS/SVG
  slice.attr({
    "stroke": "#ffffff",
  })
  // TODO: not working?
  svg.selectAll("text").attr({
    "stroke": "none",
    "fill": "black",
    "font-size": "20px",
    "font-family": "sans-serif",
  })
}
