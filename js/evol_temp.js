//initialisation d'un calendrier pour la sélection des dates
//date min
$(function () {
  $('#datepicker1').datetimepicker({
    locale: 'fr',
    format: 'DD/MM/YYYY',
    viewMode: 'years',
    minDate: '1299/12/31', //date à paramétrer en anglais
    maxDate: '1400/01/01', //date à paramétrer en anglais
  });
  $('#datepicker1').data('DateTimePicker').date('01-01-1340');
});

//date max
$(function () {
  $('#datepicker2').datetimepicker({
    locale: 'fr',
    format: 'DD/MM/YYYY',
    viewMode: 'years',
    minDate: '1299/12/31', //date à paramétrer en anglais
    maxDate: '1500/01/01', //date à paramétrer en anglais
  });
  $('#datepicker2').data('DateTimePicker').date('01/01/1360');
});

//fonction paramétrant le style par défaut pour les points
function stylizeNode(n) {
  n.style("stroke", "Tomato")
  .style("stroke-opacity", 1)
  .style("stroke-width", 1)
  .style("fill", "Tomato");
  transparentNode ? n.style("opacity", 0) : n.style("opacity", .4);  
}

//fonction paramétrant le style par défaut pour les liens
function stylizeLink(l) {
  l.style("stroke", "black")
  .style("stroke-width", 2)  
  transparentLink ? l.style("opacity", 0) : l.style("opacity", .25);
}

//variable permettant de savoir si un clic a lieu sur un objet svg ou non
var clickSvg = false;

//variable de transparence des liens et des noeuds
//sur true, ils sont transparents (opacité égale à 0)
var transparentLink = false;
var transparentNode = false;

function showLink() {//fonction gérant l'affichage ou non des liens
  if (document.getElementById("checkbox-link").checked) {
    transparentLink = false; //les liens sont transparents
  } else {
    transparentLink = true; //les liens sont visibles
  }
}

function showNode() {//fonction gérant l'affichage ou non des noeuds
  if (document.getElementById("checkbox-node").checked) {
    transparentNode = false; //les noeuds sont visibles
  } else {
    transparentNode = true; //les noeuds sont transparents
    info.update();
  }
  //affichage en fonction du paramétrage de transparence
  stylizeNode(d3.selectAll("circle"));
  stylizeLink(d3.selectAll("polyline"));
}

//initialisation de la carte
var map = L.map('map').setView([49, 8], 4);

//fond Esri topographique (par défaut)
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
  
  //paramétrage de style des noeuds
  json.nodes.forEach(function(d) { // pour chaque noeud
 
    d.LatLng = new L.LatLng(d.attributes.lat, d.attributes.lon);
    d.fixed = true;
    d.x = map.latLngToLayerPoint(d.LatLng).x;
    d.y = map.latLngToLayerPoint(d.LatLng).y;  
  })
  
  //paramétrage des données contenues dans les liens
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
      date: e.attributes.dateSource,
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
  .attr("date", function(d) {
    return d.date; //ajout d'un attribut avec l'id du noeud source
  })
  .attr("id-source", function(d) {
    return d.source.id; //ajout d'un attribut avec l'id du noeud source
  })
  .attr("id-target", function(d) {
    return d.target.id; //ajout d'un attribut avec l'id du noeud cible
  });
  
  stylizeLink(links);
  
  //paramétrage des points
  var node = svg.selectAll(".node")
  .data(json.nodes)
  .enter().append("circle")
  .attr("r", function(d) {
    return Math.sqrt(d.size*20/Math.PI);
  })
  .attr("label", function(d) {
    return d.label; //ajout d'un attribut avec le nom de la ville
  })
  .attr("onclick", "highlight_point(evt)")
  //.attr("onmouseover", "highlight_point(evt)")
  .attr("id", function(d) { //ajout d'un attribut comportant l'identifiant
    return d.id;
  });
 
  stylizeNode(node);
    
  //affichage des éléments situés entre les deux dates mises par défaut dans les inputs de date
  selectDate($('#datepicker1').data('DateTimePicker').date()._d, $('#datepicker2').data('DateTimePicker').date()._d);
    
  //se déclenche lors d'un déplacement sur la carte
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
  if (!transparentNode) {  //ne s'exécute que si les noeuds ne sont pas transparents
    clickSvg = true;//variable mise sur true, indiquant que l'élément cliqué est un noeud
    //e.preventDefault();
  
    //réinitialisation des styles pour tous les points et polylignes
    stylizeNode(d3.selectAll("circle"));
    stylizeLink(d3.selectAll("polyline"));  
  
    //augmentation de leur transparence
    d3.selectAll("circle").style("opacity", .1);
    transparentLink ? d3.selectAll("polyline").style("opacity", 0) : d3.selectAll("polyline").style("opacity", .1);
  
    //logs = d3.selectAll("polyline.link")[0]//[0].__data__.source.id;
    //console.log(logs);

    var linkTarget = d3.selectAll("[id-target='" + e.target.id + "']").filter(function (l) {return this.style.visibility !== "hidden";}) //liens dont la cible est sélectionnée
    .style("stroke", "red") //affichés en rouge
    .style("opacity", 0.6) //réduction de la transparence
    .each(function(l) { //pour chaque lien      
      var attrib = d3.select(this).attr("id-source"); //récupération de l'id source
      d3.select("[id='" + attrib + "']").style("stroke", "yellow")
      .style("stroke-width", 2)
      .style("opacity", 0.8); //modification du style du noeud cible
    });
  
    var linkSource = d3.selectAll("[id-source='" + e.target.id + "']").filter(function (l) {return this.style.visibility !== "hidden";}) //liens dont la source est sélectionnée
    .style("stroke", "blue") //affichés en bleu
    .style("opacity", 0.6) //réduction de la transparence
    .each(function(l) { //pour chaque lien
      var attrib = d3.select(this).attr("id-target"); //récupération de l'id cible
      d3.select("[id='" + attrib + "']").style("stroke", "yellow") //modification du style du noeud source
      .style("stroke-width", 2)
      .style("opacity", 0.8);
    });
  
    //affichage du nom de l'eveche sélectionné dans l'infobulle
    info.update(e.target.attributes.label.value, linkSource.size(), linkTarget.size());
  
    //changement de style pour le noeud sélectionné
    e.target.style.fill = "yellow";
    e.target.style.stroke = "yellow";
    e.target.style.strokeWidth = 2;
    e.target.style.opacity = 0.9;
  }
}

//récupération de la div contenant la frise
var frise = document.getElementById('visualization');

// Création du jeu de données de la frise chronologique des papes
var items = new vis.DataSet([
  {id: 1, content: 'Benoît XI', start: '1303-09-22', end: '1304-07-07', group: 1, className: 'white'},
  {id: 2, content: 'Clément V', start: '1305-06-05', end: '1314-04-20', group: 1, className: 'white'},
  {id: 3, content: 'Jean XXII', start: '1316-08-07', end: '1334-12-04', group: 1, className: 'white'},
  {id: 4, content: 'Benoît XII', start: '1334-12-20', end: '1342-04-25', group: 1, className: 'white'},
  {id: 5, content: 'Clément VI', start: '1342-05-07', end: '1352-12-06', group: 1, className: 'white'},
  {id: 6, content: 'Innocent VI', start: '1352-12-18', end: '1362-09-12', group: 1, className: 'white'},
  {id: 7, content: 'Urbain V', start: '1362-09-28', end: '1370-12-19', group: 1, className: 'white'},
  {id: 8, content: 'Grégoire XI', start: '1370-12-30', end: '1378-03-27', group: 1, className: 'white'},
  {id: 9, content: 'Urbain VI', start: '1378-04-08', end: '1389-10-15', group: 1, className: 'white'},  
  {id: 10, content : 'Peste noire', start: '1347-01-01', end: '1352-12-31', group: 2, className: 'red'},
  {id: 11, content : 'Guerre de Cent Ans', start: '1337-01-01', end: '1453-12-31', group: 2, className: 'red'}
]);

//distinction des règnes papaux des évènements par des groupes
var groups = new vis.DataSet([
  {id: 1, content: 'papes'},
  {id: 2, content: 'évènements'}
]);

// Configuration de la frise
var options = {
  groupOrder: 'id',
  start: "1300-01-01",
  end: "1400-01-01"
};

// Création de la frise
var timeline = new vis.Timeline(frise, items, groups, options);

timeline.on('select', function (properties) { //event s'activant en cas de sélection/déselection sur la frise
  //réinitialisation des styles pour tous les points et polylignes
  stylizeNode(d3.selectAll("circle"));
  stylizeLink(d3.selectAll("polyline"));
  //réinitialisation de l'infobulle
  info.update();
    
  var links = d3.selectAll("polyline"); //récupération de toutes les lignes générées par d3
  var selectedItem = properties.items; //récupération de l'id de l'objet sélectionné sur la frise
  
  if (selectedItem.length > 0) {//s'il y a effectivement un élément sélectionné
    
    //dates de début et fin de la période sélectionnée
    var dateMin = items._data[selectedItem].start,
    dateMax = items._data[selectedItem].end;
    
    //var event = properties.event;
    //var dates = timeline.getEventProperties(event).snappedTime;
    
    //réinitialisation des dates du datetimepicker
    //conversion des dates pour qu'elles soient au bon format pour datetimepicker
    // ex 1320-12-20 devient 12/20/1320
    $('#datepicker1').data('DateTimePicker').date(dateMin.substring(8, 10)+ "/" + dateMin.substring(5, 7) + "/" + dateMin.substring(0, 4));
    $('#datepicker2').data('DateTimePicker').date(dateMax.substring(8, 10)+ "/" + dateMax.substring(5, 7) + "/" + dateMax.substring(0, 4));

    //conversion dans un format numérique des dates afin de les comparer ensuite
    date1 = Date.parse(dateMin);
    date2 = Date.parse(dateMax);
  
    links.each(function(l) { //pour chaque lien
      dateNum = Date.parse(l.date); //récupération de la date du lien
      if (dateNum >= date1 && dateNum < date2) { //s'il est compris entre les deux bornes temporelles alors
        d3.select(this).style("visibility", "visible"); //le rendre visible
      } else {
        d3.select(this).style("visibility", "hidden"); //sinon, le cacher
      }
    });
  } else {//s'il s'agit d'une déselection en cliquant dans le vide
    links.style("visibility", "visible"); //rendre tous les liens visibles
    
    //vider les dates présentes dans le calendrier
    $('#datepicker1').data('DateTimePicker').clear();
    $('#datepicker2').data('DateTimePicker').clear();
  }
  
  //ajustement de la taille des cercles en fonction du nombre de liens
  svg.selectAll("circle").each(function(n) {
    var linkTarget = d3.selectAll("[id-target='" + n.id + "']").filter(function (l) {return this.style.visibility === "visible";}),
    linkSource = d3.selectAll("[id-source='" + n.id + "']").filter(function (l) {return this.style.visibility === "visible";}),
    countTarget = linkTarget.size(),
    countSource = linkSource.size(),
    countAll = countSource + countTarget;    
    d3.select("[id='" + n.id + "']").attr("r", Math.sqrt(countAll*20/Math.PI));
  });
});

//fonction de sélection des liens compris entre les bornes temporelles sélectionnées
function selectDate(dateMin, dateMax) {

  //réinitialisation des styles pour tous les points et polylignes
  showLink();
  stylizeNode(d3.selectAll("circle"));
  stylizeLink(d3.selectAll("polyline"));
  //réinitialisation de l'infobulle
  info.update();
  
  if (dateMin && dateMax) { //si les deux dates sont rentrées
    var date1 = Date.parse(dateMin),
    date2 = Date.parse(dateMax);
    
    if (date1 > date2) {      
      alert("Dates incorrectes!");
      
    } else {      
      var links = d3.selectAll("polyline");
  
      links.each(function(l) { //pour chaque lien
        dateNum = Date.parse(l.date); //récupération de la date du lien
        if (dateNum >= date1 && dateNum < date2) { //s'il est compris entre les deux bornes temporelles alors
          d3.select(this).style("visibility", "visible"); //le rendre visible
        } else {
          d3.select(this).style("visibility", "hidden"); //sinon, le cacher
        }
      });
    
      //ajustement de la taille des cercles en fonction du nombre de liens
      svg.selectAll("circle").each(function(n) {
        var linkTarget = d3.selectAll("[id-target='" + n.id + "']").filter(function (l) {return this.style.visibility === "visible";}),
        linkSource = d3.selectAll("[id-source='" + n.id + "']").filter(function (l) {return this.style.visibility === "visible";}),
        countTarget = linkTarget.size(),
        countSource = linkSource.size(),
        countAll = countSource + countTarget;    
        d3.select("[id='" + n.id + "']").attr("r", Math.sqrt(countAll*20/Math.PI));
      });
    }
  }
}

//div d'affichage du nom de la ville intégré à la carte
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
      "Cliquez sur un évêché pour plus d'informations" + "</h6>"
    ) ;
}

function onMapClick(e) { //comportement au clic sur la carte
  
  if (!clickSvg) {//si l'élément cliqué n'est pas un noeud
    //réinitialisation des styles pour tous les points et polylignes
    stylizeNode(d3.selectAll("circle"));
    stylizeLink(d3.selectAll("polyline"));
    //réinitialisation de l'infobulle
    info.update();
   
  } else {//si l'élément cliqué est un noeud
    //remise sur false de la variable
    clickSvg = false;
  }
}

map.on('click', onMapClick);

info.addTo(map);








