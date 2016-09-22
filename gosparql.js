var gosparql = {
  version: "0.0.1",
  endpoint: "http://data.cso.ie/sparql",
  debug: false
}

gosparql.query = function(endpoint, sparql, callback) {
  endpoint = endpoint || gosparql.endpoint
  var url = endpoint + "?format:application%2Fsparql-results%2Bjson&query=" + encodeURIComponent(sparql)
  var mime = "application/sparql-results+json"
  d3.xhr(url)
    .header("accept", mime)
    .header("Access-Control-Allow-Origin", "*")
    .get(function(error, data) {
      if (error) {
        d3.select("#query-alert").html(error.responseText).attr("class", "alert alert-error")
      } else {
        d3.select("#query-alert").html("").attr("class", "hidden")
        var json = data.responseText
        callback(JSON.parse(json))
      }
    })
  d3.select("#query-alert").html("Please wait..").attr("class", "alert alert-info")
}


/* Lib Query */
gosparql.getDatasets= function(){
    var sparql = "SELECT DISTINCT ?value ?label WHERE {?value a <http://purl.org/linked-data/cube#DataSet>"
                + "OPTIONAL{?value rdfs:comment|rdfs:label ?label.}"
                + "FILTER (lang(?label) = 'en')}"
  return query;
}

gosparql.getCubeSliceGraph= function(dataCubeURI) {

    var query = "PREFIX qb: <http://purl.org/linked-data/cube#>"
      + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
      + "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>"
      + "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>"
      + "select distinct ?graph_uri where {"
      + "GRAPH ?graph_uri {"
      + "{?dataset rdf:type qb:DataSet }"
      + "UNION {?dataset rdf:type qb:Slice}"
      + " }"
      + "}"
  return query;
}


gosparql.getCubeStructureGraph= function(dataCubeURI) {
  var query= "PREFIX qb: <http://purl.org/linked-data/cube#>"
      + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
      + "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>"
      + "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>"
      + "select distinct ?graph_uri where{"
      + "?cube_uri qb:structure ?dsd. "
      + "GRAPH ?graph_uri{"
      + "?dsd rdf:type qb:DataStructureDefinition }"
      + "}"
  return query;
}


gosparql.getCubeDSD = function(dataCubeURI) {

  var query = "PREFIX qb: <http://purl.org/linked-data/cube#>"
            + "select distinct ?dsd where{"
      query += "<" + dataCubeURI + ">" + " qb:structure ?dsd."
            + "}"
  return query;
}

gosparql.getAvailableCubeLanguages = function() {

  var query = "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>"
            + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
            + "select distinct (lang(?label) as ?lang) where {"
            + "?x skos:prefLabel ?label"
            + "}"
  return query;
}


gosparql.getDataCubeAttributes= function(dataCubeURI) {

 var query = "PREFIX qb: <http://purl.org/linked-data/cube#>"
    + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    + "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>"
    + "select  distinct ?value ?label where {";

  query += "<" + dataCubeURI + ">" + " qb:structure ?dsd.";

  query += "?dsd qb:component ?comp."
      + "?comp qb:attribute ?attribute."
      + "OPTIONAL {?attribute qb:concept ?concept.}"
      + "OPTIONAL {?concept skos:prefLabel|rdfs:label ?label.}"
      + "}";


  return query;
}

gosparql.getAttributeValues= function(dataCubeURI, attributeURI) {

    var query = "PREFIX qb: <http://purl.org/linked-data/cube#>"
        + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
        + "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>"
        + "select distinct ?value ?label where {";

    query += "<" + dataCubeURI + ">" + " qb:structure ?dsd.";

    query += "?observation qb:dataSet <" + dataCubeURI + "> ."
          + "?observation <" + attributeURI + "> ?value.";
          + "OPTIONAL{?value skos:prefLabel|rdfs:label ?label.}";
          + "FILTER (lang(?label) = 'en')}";

  return query;
}




gosparql.getDataCubeDimensions = function(dataCubeURI) {

  var query = "PREFIX qb: <http://purl.org/linked-data/cube#>"
    + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    + "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>"
    + "select  distinct ?value ?label ?title where {";

  query += "<" + dataCubeURI + ">" + " qb:structure ?dsd.";

  query += "?dsd qb:component  ?cs."
    + "?cs qb:dimension ?value." +
    "OPTIONAL{?value qb:concept ?cons.?cons skos:prefLabel|rdfs:label ?title.}"+
    "OPTIONAL{?value rdfs:comment|rdfs:label ?label.}}";


  return query;
}


gosparql.getDataCubeMeasure = function(dataCubeURI) {

 var query = "PREFIX qb: <http://purl.org/linked-data/cube#>"
    + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    + "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>"
    + "select  distinct ?value ?label ?title where {";

  query += "<" + dataCubeURI + ">" + " qb:structure ?dsd.";

  query += "?dsd qb:component  ?cs."
      + "?cs qb:measure  ?value."+
      "OPTIONAL{?value qb:concept ?cons.?cons skos:prefLabel|rdfs:label ?title.}"+
      "OPTIONAL{?value rdfs:comment|rdfs:label ?label.}}";


  return query
}

gosparql.getDimensionValues = function(dataCubeURI, dimensionURI) {

    var query = "PREFIX qb: <http://purl.org/linked-data/cube#>"
        + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
        + "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>"
        + "select  distinct ?value ?level ?label where {";

    query += "?observation qb:dataSet <" + dataCubeURI + "> ."
        + "?observation <" + dimensionURI + "> ?value.";
    query += "OPTIONAL{?value skos:prefLabel|rdfs:label ?label.}";
    query += "OPTIONAL{ ?level skos:member ?value.}";
    query += "FILTER (lang(?label) = 'en')}";


  return query
}

gosparql.getObservationValues = function(dataCubeURI, measureURI, colsDimURI, rowsDimURI, fixedDimURI, fixedDimValueURI) {

  query = "PREFIX qb: <http://purl.org/linked-data/cube#>"
      + "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
      + "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>"
      + "select  distinct ?value ?col ?row ?fixed where {";

  query += "<" + dataCubeURI + "> qb:structure ?dsd.";

  query += "?observation qb:dataSet <"  + dataCubeURI + "> ."
         + "?observation <"+ measureURI + "> ?value."
         + "?observation <"+ colsDimURI + "> ?c."
         + "?observation <"+ rowsDimURI + "> ?r."
         + "?observation <"+ fixedDimURI + "> <"+ fixedDimValueURI + "> ."
         + "OPTIONAL {?c skos:prefLabel|rdfs:label ?col. }"
         + "OPTIONAL {?r skos:prefLabel|rdfs:label ?row. }"
         + "OPTIONAL {<"+ fixedDimValueURI + ">  skos:prefLabel|rdfs:label ?fixed. }"

         + "FILTER (lang(?col) = 'en')"
         + "FILTER (lang(?row) = 'en')"
         + "FILTER (lang(?fixed) = 'en')}"
         + "LIMIT 2000";
         ;

  return query

}
