//initialisation des infobulles
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip(); 
});

//variable paramétrant le fait de cacher ou afficher des éléments
var hide = false;

//fonction paramétrant le style par défaut pour les points
function stylizeNode(n) {
  n.style("stroke-opacity", 1)
  .style("stroke-width", 1)
  .style("stroke", function(d) {
    if (d.attributes.type_dioc === "diocese") {
      return "OrangeRed";
    } else {
      return "Indigo";
    }
  })
  .style("fill", function(d) {
    if (d.attributes.type_dioc === "diocese") {
      return "OrangeRed";
    } else {
      return "Indigo";
    }
  });  
  hide ? n.style("opacity", .2) : n.style("opacity", .6);
}

//fonction paramétrant le style par défaut pour les liens
function stylizeLink(l) {
  l.style("stroke-width", 2)
  .style("opacity", 0);
}

//initialisation de la carte
var map = L.map('map').setView([49, 8], 4);

//fond Esri topographique
var Esri_WorldShadedRelief = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
  maxZoom: 13
}).addTo(map);

//fond OSM Black and White
var OpenStreetMap_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

function selectLayer() {//fonction correspondant aux boutons radio pour sélectionner un fond
  if (document.getElementById("osm").checked) {
    map.removeLayer(Esri_WorldShadedRelief);
    OpenStreetMap_BlackAndWhite.addTo(map);
  } else {
    map.removeLayer(OpenStreetMap_BlackAndWhite);
    Esri_WorldShadedRelief.addTo(map);
  }
}

L.control.scale({position: 'bottomright'}).addTo(map);

/* initialisation de la couche SVG */
map._initPathRoot();
 
/* récupération de l'objet SVG de la carte */
var svg = d3.select("#map").select("svg");
svg.append("g");

// paramétrage de la donnée à afficher à l'aide de d3
d3.json("data/localisation_diocese.json", function(error, json) {
 
  if (error) throw error;
  
  //paramétrage des données des noeuds
  json.nodes.forEach(function(d) { // pour chaque noeud
    d.LatLng = new L.LatLng(d.attributes.lat, d.attributes.lon);
    d.fixed = true;
    d.x = map.latLngToLayerPoint(d.LatLng).x;
    d.y = map.latLngToLayerPoint(d.LatLng).y;
  })    
  
  //paramétrage des données des liens
  var edges = [];
  json.edges.forEach(function(e) {
    var sourceNode = json.nodes.filter(function(n) {
      return n.id === e.source;
    })[0],
    targetNode = json.nodes.filter(function(n) {
      return n.id === e.target;
    })[0];
    
    edges.push({
      source: sourceNode,
      target: targetNode,
      statut: e.attributes.statut_arrivee
    });
  });
  
  //définition des fleches
  svg.append("defs").append("marker")
    .attr("id", "marker")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 10)
    .attr("refY", 0)
    .attr("markerWidth", 4)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5");
  
  //paramétrage des liens
  var links = svg.selectAll(".link")
  .data(edges)
  .enter().append("polyline")
  .attr("class", "link")
  .attr("marker-mid", "url(#marker)")
  .attr("id-source", function(d) {
    return d.source.id; //ajout d'un attribut avec l'id du noeud source
  })
  .attr("id-target", function(d) {
    return d.target.id; //ajout d'un attribut avec l'id du noeud cible
  })
  .attr("statut", function(d) {
    return d.statut; //attribut précisant s'il s'agit d'un transfert ou d'une première nomination
  });
 
  stylizeLink(links);

  //paramétrage des points 
  var node = svg.selectAll(".node")
  .data(json.nodes)
  .enter().append("circle")
  .attr("r", 4)
  .attr("label", function(d) {
    return d.label; //ajout d'un attribut avec le nom de la ville
  })
  .attr("onmouseover", "highlight_point(evt)")
  .attr("onmouseout", "reset_evt(evt)")
  .attr("id", function(d) { //ajout d'un attribut comportant l'identifiant
    return d.id;
  });

  stylizeNode(node);
  
  //se déclenche lors d'un chargement/rechargement de la carte
  map.on("viewreset", update);
  update();
   
  function update() {
  //ajustement du positionnement des points selon le zoom 
    node.attr("transform", function(d) {
      if (d.fixed == true) {
        d.x = map.latLngToLayerPoint(d.LatLng).x;
        d.y = map.latLngToLayerPoint(d.LatLng).y;
        return "translate(" +
          map.latLngToLayerPoint(d.LatLng).x + "," +
          map.latLngToLayerPoint(d.LatLng).y + ")";
      }
    });
   
    //paramétrage des liens à afficher entre les points
    //au travers de l'attribut "points"
    links.attr("points", function(d) {
      return d.source.x + "," + d.source.y + " " + (d.source.x+d.target.x)/2 + "," + (d.source.y+d.target.y)/2 + " " + d.target.x + "," + d.target.y
    });
  }  
});  

function highlight_point(e) {  
  
  //récupération des liens de l'objet sélectionné
  if (document.getElementById("transfert").checked && document.getElementById("nomination").checked) {//si on affiche les transferts et premières nominations
    var linkTarget = d3.selectAll("[id-target='" + e.target.id + "']"); //liens dont la cible est sélectionnée
    var linkSource = d3.selectAll("[id-source='" + e.target.id + "']"); //liens dont la source est sélectionnée
  } else if (!document.getElementById("transfert").checked && document.getElementById("nomination").checked) {//si on affiche que les premières nominations
    var linkSource = d3.selectAll("[id-source='" + e.target.id + "']").filter(function (l) {return l.statut === "pourvu";});
    var linkTarget = d3.selectAll("[id-target='" + e.target.id + "']").filter(function (l) {return l.statut === "pourvu";});
  } else if (document.getElementById("transfert").checked && !document.getElementById("nomination").checked) {//si on affiche que les premières nominations
    var linkSource = d3.selectAll("[id-source='" + e.target.id + "']").filter(function (l) {return l.statut === "a été transféré";});
    var linkTarget = d3.selectAll("[id-target='" + e.target.id + "']").filter(function (l) {return l.statut === "a été transféré";});
  } else {
    //affichage du nom de l'eveche sélectionné dans l'infobulle
    info.update(e.target.attributes.label.value, 0, 0);
    return; //sortir de la fonction
  }
  
  
  //cacher les éléments
  hide = true;  
  
  //réinitialisation des styles pour tous les points et polylignes sauf ceux de la légende
  stylizeNode(d3.selectAll('circle:not([svgLegend="true"])'));
  stylizeLink(d3.selectAll("polyline"));

  hide = false;
  
  if (!document.getElementById("mvt_source").checked) { //si l'on affiche tous les déplacements ou que les déplacements arrivant au point sélectionné
    linkTarget.style("stroke", "red") //affichés en rouge
    .style("opacity", 0.6) //réduction de la transparence
    .each(function(l) { //pour chaque lien
      var attrib = d3.select(this).attr("id-source"); //récupération de l'id source
      d3.select("[id='" + attrib + "']").style("stroke", "yellow")
      .style("stroke-width", 2)
      .style("opacity", 0.8); //modification du style du noeud cible
    });  
  }

  if (!document.getElementById("mvt_target").checked) { //si l'on affiche tous les déplacements ou que les déplacements à partir du point sélectionné
    linkSource.style("stroke", "blue") //affichés en bleu
    .style("opacity", 0.6) //réduction de la transparence
    .each(function(l) { //pour chaque lien
      var attrib = d3.select(this).attr("id-target"); //récupération de l'id cible
      d3.select("[id='" + attrib + "']").style("stroke", "yellow") //modification du style du noeud source
      .style("stroke-width", 2)
      .style("opacity", 0.8);
    });
  }

  //affichage du nom de l'eveche sélectionné dans l'infobulle
  info.update(e.target.attributes.label.value, linkSource.size(), linkTarget.size());

  //changement de style pour le noeud sélectionné
  e.target.style.fill = "yellow";
  e.target.style.stroke = "yellow";
  e.target.style.strokeWidth = 2;
  e.target.style.opacity = 0.9;
}

//div d'affichage du nom de la ville intégrée à la carte
var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info');
  this._div.id = "info";
  this.update();  
  return this._div;
}
  
info.update = function(name, countStart, countEnd) {
  this._div.innerHTML = "<h6 class='text-center'>" + (
    name ?
      name + "</h6><label>" + countStart + (countStart > 1 ? " départs<br>" :" départ<br>") + countEnd + (countEnd > 1 ? " arrivées</label>" : " arrivée</label>"): 
      "Survolez un évêché avec le curseur pour plus d'informations" + "</h6>"
  );
}
  
function reset_evt(e) { //fonction s'activant à la sortie d'un noeud svg
  //réinitialisation des styles pour tous les points et polylignes sauf ceux de la légende
  stylizeNode(d3.selectAll('circle:not([svgLegend="true"])'));
  stylizeLink(d3.selectAll("polyline"));
  //réinitialisation de l'infobulle
  info.update();   
}

info.addTo(map);

//légende de la carte
var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info');
  
  //cercles proportionnels superposés de la légende
  div.innerHTML += '<svg width="110" height="40">' +
    '<circle cx="10" cy="10" r="4" svgLegend="true" style="fill: OrangeRed; stroke-opacity: 1; stroke-width: 1; opacity: 0.6;"></circle>' +
    '<text x="30" y="14" style="fill: white;">évêché</text>' +
    '<circle cx="10" cy="30" r="4" svgLegend="true" style="fill: Indigo; stroke-opacity: 1; stroke-width: 1; opacity: 0.6;"></circle>' +
    '<text x="30" y="34" style="fill: white;">archevêché</text></svg>';

  return div;
};

legend.addTo(map);





    