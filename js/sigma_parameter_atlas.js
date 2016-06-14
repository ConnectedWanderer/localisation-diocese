//initialisation des infobulles
$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip(); 
});

// ajout d'une méthode au modèle de graphe qui renvoie un objet incluant chaque voisin d'un noeud
sigma.classes.graph.addMethod('neighbors', function(nodeId) {
  var k,
      neighbors = {},
      index = this.allNeighborsIndex[nodeId] || {};

  for (k in index)
    neighbors[k] = this.nodesIndex[k];

  return neighbors;
});

var s = new sigma({
  renderer: {
    container: document.getElementById('sigma-container'),
    type: 'canvas'
  },
  settings: {
    labelThreshold: 20, //affichage des labels à partir d'une taille donnée du noeud
    minEdgeSize: 0.05, //largeur mini des liens
    maxEdgeSize: 0.4, //largeur maxi des liens
    minNodeSize: 0.5, //largeur mini des noeuds
    maxNodeSize: 5.5, //largeur maxi des noeuds
    labelColor: 'node', //affiche une couleur de label identique à celle des noeuds
    borderSize: 1,
    defaultNodeBorderColor: '#888888', //couleur de bordure des noeuds survolés
  }
});

var tabUnique=[];
var tab = [];
sigma.parsers.gexf(
  'data/force_atlas.gexf', s, function(s) {
    s.graph.nodes().forEach(function(n) {
      n.originalColor = n.color;
      tab.push({
        souverain: n.attributes.souverain,
        color: n.color
      });
    });
    
    for(i = 0; i< tab.length; i++){    
      if(tabUnique.map(function(e) { return e.souverain; }).indexOf(tab[i].souverain) === -1){
        tabUnique.push({
          souverain:tab[i].souverain,
          color:tab[i].color,
          sum: 1
        });        
      } else {
        var ind = tabUnique.indexOf(tab[i].souverain);
        if (tabUnique[ind]) {
          tabUnique[ind].sum++;
        }
      }  
    }
  
    var result = tab.reduce(function(sums,entry){
      sums.color = entry.color;
      sums.souverain = entry.souverain;
      sums.somme = (sums[entry.somme] || 0) + 1;
      return sums;
    },{});
    
    //rendu de base des liens
    s.graph.edges().forEach(function(e) {
      e.originalColor = '#888888';
      e.color = e.originalColor;
      e.originalSize = e.size;
    });
    
    //actualisation du rendu
    s.refresh();

    // Lorsqu'un noeud est cliqué, on met en avant le noeud cliqué et les noeuds connectés à celui-ci
    // Les liens connectés au noeud cliqué sont aussi mis en avant
    s.bind('clickNode', function(e) {
      var nodeId = e.data.node.id,
          toKeep = s.graph.neighbors(nodeId);
      toKeep[nodeId] = e.data.node;
      
      document.getElementById('block').innerHTML = e.data.node.attributes.souverain;

      s.graph.nodes().forEach(function(n) {
          n.color = '#888888'; //passage en gris de tous les points
      });

      s.graph.edges().forEach(function(e) {
        if (document.getElementById("mvt_target").checked) { //affichage des liens arrivant au point cliqué
          if (toKeep[e.source] && toKeep[e.target] && e.target == nodeId) { //élément cliqué comme target
            //paramétrage du rendu des liens
            e.color = 'red';
            e.size = 0.3;
            e.type = 'arrow';
            
            //paramétrage du rendu des points sources liés à la cible
            toKeep[e.source].color = toKeep[e.source].originalColor;
            
          } else {
            e.color = e.originalColor;
            e.size = 0.1;
            e.type = 'line';
          }
          
        } else if (document.getElementById("mvt_source").checked) { //affichage des liens partant du point cliqué
          if (toKeep[e.source] && toKeep[e.target] && e.source == nodeId) { //élément cliqué comme source         
            //paramétrage du rendu des liens
            e.color = '#00BFFF';
            e.size = 0.3;
            e.type = 'arrow';
            
            //paramétrage du rendu des points cibles liés à la source
            toKeep[e.target].color = toKeep[e.target].originalColor;
            
          } else {
            e.color = e.originalColor;
            e.size = 0.1;
            e.type = 'line';
          }
          
        } else if (document.getElementById("mvt_all").checked) { //affichage de tous les liens
          if (toKeep[e.source] && toKeep[e.target] && e.target == nodeId) { //élément cliqué comme target
            //paramétrage du rendu des liens
            e.color = 'red';
            e.size = 0.3;
            e.type = 'arrow';
            
            //paramétrage du rendu des points sources liés à la cible
            toKeep[e.source].color = toKeep[e.source].originalColor;
            
          } else if (toKeep[e.source] && toKeep[e.target] && e.source == nodeId) { //élément cliqué comme source         
            //paramétrage du rendu des liens
            e.color = '#00BFFF';
            e.size = 0.3;
            e.type = 'arrow';
            
            //paramétrage du rendu des points cibles liés à la source
            toKeep[e.target].color = toKeep[e.target].originalColor;
            
          } else {
            e.color = e.originalColor;
            e.size = 0.1;
            e.type = 'line';
          }
        }
        
        //rendu du point cliqué
        toKeep[nodeId].color = toKeep[nodeId].originalColor;
      });

      // mise à jour du rendu
      s.refresh();
    });
    
    // Quand l'on clique en dehors des noeuds, affichage du rendu avec le paramétrage d'origine
    s.bind('clickStage', function(e) {
      s.graph.nodes().forEach(function(n) {
        n.color = n.originalColor;
      });

      s.graph.edges().forEach(function(e) {
        e.color = e.originalColor;
        e.size = e.originalSize;
        e.type = 'line';
      });

      //mise à jour du rendu
      s.refresh();
    });    
  }
);

//Création de la div pour afficher les info du royaume survolé à la souris
var iDiv = document.createElement('div');
iDiv.id = 'block';
iDiv.className = 'block';
iDiv.innerHTML = 'Cliquez sur un noeud pour visualiser ses connections';
document.getElementById('sigma-container').appendChild(iDiv);













