//fonction paramétrant le style par défaut pour les points
function stylizeNode(n) {
  n.style("stroke", "Tomato")
  .style("stroke-opacity", 1)
  .style("stroke-width", 1)
  .style("fill", "Tomato")
  .style("opacity", .8);
  
  transparent ? 
    n.attr("visibility", "hidden") : //si les points ne sont pas affichées, application de la valeur "hidden"
    n.attr("visibility", "visible"); //sinon utilisation de la valeur "visible"
}

//fonction paramétrant le style par défaut pour les liens
function stylizeLink(l) {
  l.style("stroke", "black")
  .style("stroke-width", 2)
  .style("opacity", .4);
  
  transparent ?
    l.attr("visibility", "hidden") : //si les lignes ne sont pas affichées, application de la valeur "hidden"
    l.attr("visibility", "visible"); //sinon utilisation de la valeur "visible"
}

//variable de transparence des liens et des noeuds
//sur true, ils sont transparents (opacité égale à 0)
var transparent = true;
var firstLoad = true; //variable concernant le chargement des noeuds
var otherColor = '#252525'; //couleur des Etats grisés

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

//paramétrage de la couleur des Etats selon le taux de transfert intra
function choroplethe(valeur) {
      if (valeur < 25) {
          return '#bae4b3';
      }
      if (valeur < 50) {
          return '#74c476';
      }
      if (valeur < 75) {
          return '#31a354';
      }
      if (valeur >= 75) {
          return '#006d2c';
      }
}

/* initialisation de la couche SVG */
map._initPathRoot();

//chargement du geojson des Etats
$.getJSON("data/taux_intra_v4.geojson",function(data){
// ajout du geojson comme couche une fois ce dernier chargé
  geojson = L.geoJson(data, {
    style : function (feature) {
      if (feature.properties.type === "entité majeure") {
        return {
          fillColor: choroplethe(feature.properties.final_taux),
          color: "black",
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.8,
          dashArray: 4,
        }
      } else {
        return {
          fillColor: otherColor,
          color: "black",
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.2,
          dashArray: 4,
        }
      }
    },
    onEachFeature: onEachFeature
  }).addTo(map);
});

/* récupération de l'objet SVG de la carte */
var svg = d3.select("#map").select("svg");
var layer2 = svg.append("g");

// paramétrage de la donnée à afficher à l'aide de d3
function showNode() {
  if (document.getElementById("checkbox-node").checked && firstLoad) {//si la case d'affichage des diocèses est cochée et qu'il s'agit du premier chargement
    
    firstLoad = false;
    d3.json("data/transferts_intrav3.json", function(error, json) {
     
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
          souverain: e.attributes.souverain
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
      .attr("souverain", function(d) {
        return d.souverain; //ajout d'un attribut avec le nom du royaume
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
      .attr("r", 2)
      .attr("souverain", function(d) {
        return d.attributes.souverain; //ajout d'un attribut avec le nom de l'Etat souverain
      })
      .attr("id", function(d) { //ajout d'un attribut comportant l'identifiant
        return d.id;
      });
     
      stylizeNode(node);
      console.log(node);
      
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
    
  } else if (document.getElementById("checkbox-node").checked && !firstLoad) { //si l'on souhaite réafficher les noeuds (ceux-ci sont chargés)

    //affichage en fonction du paramétrage de transparence
    stylizeNode(d3.selectAll("circle"));
    stylizeLink(d3.selectAll("polyline"));
  
  } else if (!firstLoad) { //si l'on souhaite cacher les noeuds
    
    transparent = true;
    //affichage en fonction du paramétrage de transparence
    stylizeNode(d3.selectAll("circle"));
    stylizeLink(d3.selectAll("polyline"));
  }  
}    

//affichage du nom du pays, du nombre d'évènements et de morts
function onEachFeature(feature, layer) {
 
  //effet au survol d'une Etat
  layer.on("mouseover", function (e) {
    
    layer.setStyle({weight: 2});
    var souverain = feature.properties.souverain;
    
    if (feature.properties.type === 'entité majeure') {    
      
      info.update(souverain, feature.properties.final_taux);
    
      if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront(); //permet de mettre au premier plan l'élément survolé, évite les soucis de chevauchement des bordures sur les polygones
      }
    
      layer.setStyle({fillOpacity: 1});
    
      //affichage des noeuds et liens de l'Etat choisi
      if (document.getElementById("checkbox-node").checked) {
        transparent = false;
        stylizeNode(d3.selectAll("circle[souverain=\"" + souverain + "\"]"));
        stylizeLink(d3.selectAll("polyline[souverain=\"" + souverain + "\"]"));
        layer.setStyle({fillOpacity: 0}); //remplissage invisible pour afficher clairement les noeuds et liens
      }
      
    } else {
      info.update(souverain, null);
    }
  });
  
  //zoom sur le pays cliqué
  layer.on("click", function (e) {
    map.fitBounds(e.target.getBounds());
  });
  
  //réapplication du style normal une fois le survol achevé
  layer.on("mouseout", function (e) {
    
    geojson.resetStyle(e.target);
    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToBack();
    }
    info.update();

    if (document.getElementById("checkbox-node").checked) {
      var souverain = feature.properties.souverain; 
      transparent = true; 
      stylizeNode(d3.selectAll("circle[souverain=\"" + souverain + "\"]"));
      stylizeLink(d3.selectAll("polyline[souverain=\"" + souverain + "\"]"));
    }
  });
};

//div d'affichage du nom de la ville intégré à la carte
var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info');
  this._div.id = "info";
  this.update();  
  return this._div;
}
  
info.update = function(souverain, tauxIntra) {
  this._div.innerHTML = "<h6 class='text-center'>" + (
    souverain ?
      souverain + "</h6>" + (tauxIntra ? "<label class='text-center'>" + tauxIntra + "% des transferts sont effectués<br>à l'intérieur du royaume</h6>" : "") : 
      "Déplacez le curseur sur un royaume pour plus d'informations" + "</h6>"
  );
}
  
info.addTo(map);
  
//légende de la carte
var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend');  
  classes = [0, 25, 50, 75, 100],
  labels = [];
  
  div.innerHTML += '<span style="color: white;">Part de transferts intra-royaumes<br></span>'
  
  // loop through our density intervals and generate a label with a colored square for each interval
  for (var i = 0; i < classes.length-1; i++) {
    div.innerHTML +=
      '<i style="background:' + choroplethe(classes[i]) + '"></i><span style="color: white;">' +
      classes[i] + ' % &ndash; ' + classes[i + 1] + ' %<br>' + '</span>';
  }
  
  div.innerHTML += '<i style="background:' + otherColor + '; opacity:0.2;"></i><span style="color: white;">autre entité</span>';

  return div;
};

legend.addTo(map);






