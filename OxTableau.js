function OxTableau ($conteneur, proprietesUtil) {
	var instance = this;
	var sdd;

	proprietes = $.extend({}, {
		hauteurDeLigne: 40,
		colonnesRetaillables: false,
		estTriable: true,
		estGroupable: false,
		estTriable: true,
		groupementAutorise: false,
		colonneDeplacable: false,
		donneesDeplacables: false,
		hauteurLigneFixe: true,
		infosBulles: true,
		estRedimensionnable: false,
		modeDeSelection: { objet: "ligne", methode: "unique" },
		alignement: "gauche",
		afficherNumeroLigne: false,
		modeleDeCellule: null,
		modeleDeLigne: null,
		cheminWorker: ""
	},
	proprietesUtil);
	proprietes.modeDeSelection = $.extend({}, {
		objet: "ligne",
		methode: "unique"
	},
	proprietesUtil.modeDeSelection);

	const NOM = proprietes.nomProprietes && proprietes.nomProprietes.nom || "nom";
	const REFERENCE = proprietes.nomProprietes && proprietes.nomProprietes.reference || "reference";
	const FORMAT = proprietes.nomProprietes && proprietes.nomProprietes.format || "format";
	const AFFICHAGEDATE = proprietes.nomProprietes && proprietes.nomProprietes.affichageDate || "affichageDate";
	const LARGEUR = proprietes.nomProprietes && proprietes.nomProprietes.largeur || "largeur";
	const ALIGNEMENT = proprietes.nomProprietes && proprietes.nomProprietes.alignement || "alignement";
	const ESTTRIABLE = proprietes.nomProprietes && proprietes.nomProprietes.estTriable || "estTriable";
	const ESTFILTRABLE = proprietes.nomProprietes && proprietes.nomProprietes.estFiltrable || "estFiltrable";
	const ESTGROUPABLE = proprietes.nomProprietes && proprietes.nomProprietes.estGroupable || "estGroupable";
	const ESTAFFICHEE = proprietes.nomProprietes && proprietes.nomProprietes.estAffichee || "estAffichee";
	const ESTSELECTIONNE = proprietes.nomProprietes && proprietes.nomProprietes.estSelectionne || "estSelectionne";
	const NONSELECTIONNABLE = proprietes.nomProprietes && proprietes.nomProprietes.nonSelectionnable || "nonSelectionnable";
	const ESTREDIMENSIONNABLE = proprietes.nomProprietes && proprietes.nomProprietes.estRedimensionnable || "estRedimensionnable";
	const PREFIXE = proprietes.nomProprietes && proprietes.nomProprietes.prefixe || "prefixe";
	const SUFFIXE = proprietes.nomProprietes && proprietes.nomProprietes.suffixe || "suffixe";
	const CLASSELIGNE = proprietes.nomProprietes && proprietes.nomProprietes.classeLigne || "classeLigne";

	var objEntete;
	var objStructure;
	var objDefilement;
	var contenu;
	var nbEltAffichables;
	var positionVue = 0;						// numéro du premier élément affiché parmi nbEltAffichables;
	var elementsSelectionnes = [];
	var infoBulle;
	var fenetreAnnexe;

	function getPileAppels() {
		var listeFonctions = new Array();
		try { this() }
		catch(e) {
			var listeAppels = e.stack.split(/\n/g);
			for (var i = 1 ; i < listeAppels.length ; i++)
				listeAppels[i] && listeFonctions.push(listeAppels[i].split('@')[0]);
		}
		return listeFonctions;
	}

	function creerSourceDeDonnees(donnees) {
		sdd = donnees && donnees.constructor.name == "oxSourceDeDonnees" ? donnees : new oxSourceDeDonnees(donnees, { cheminWorker: proprietes.cheminWorker });
		sdd.abonnerEvenement("tri", function (donnees, selecteur, afficherSelonRegroupement) {
			//sdd.getElements().oxDonneesAffichees = selecteur;
		//	objEntete.reinitialiserAffichageEntete();
			objEntete.reinitialiserAffichageEntete(sdd.getListeActionsDeSubsomption());
			afficher(positionVue);
			colorerColonnesEnFonctionDesActions();				// TODO la coloration doit etre gérer dans la fct afficher en fcontion de l'état de la colonne
		});
		sdd.abonnerEvenement("filtre", function (donnees, selecteur) {
			/*if (Object.keys(selecteur)[0])
				sdd.getElements().oxDonneesAffichees = selecteur;*/
			objEntete.reinitialiserAffichageEntete(sdd.getListeActionsDeSubsomption());
			nbEltAffichables = donnees.length;
			objDefilement.setHauteurContenu(nbEltAffichables * proprietes.hauteurDeLigne);
			afficher(positionVue);
		});
		sdd.abonnerEvenement("groupe", function (donnees, selecteur) {
			//sdd.getElements().oxDonneesAffichees = selecteur;
		//	objEntete.reinitialiserAffichageEntete();
			//selecteur && objEntete.afficherInfosEntete(selecteur);
			objEntete.reinitialiserAffichageEntete(sdd.getListeActionsDeSubsomption());
			nbEltAffichables = donnees.length;
			objDefilement.setHauteurContenu(nbEltAffichables * proprietes.hauteurDeLigne);
			afficher();
		});
	}

	function colorerColonnesEnFonctionDesActions() {
		var listeColonnes = objEntete.getColonnes();
		var listeLignes = objStructure.getListeLignes();

		for (var i = 0 ; i < listeColonnes.length ; i++)
			for (var j = 0 ; j < listeLignes.length ; j++) {
				listeLignes[j].getListeCellules()[i].getHtml().className = listeLignes[j].getListeCellules()[i].getHtml().className.replace(/ ?ox-colonneTriee/g, '');
				if (listeColonnes[i].oxSensTri)
					listeLignes[j].getListeCellules()[i].getHtml().className += " ox-colonneTriee";
			}
	}

	function calculerHauteurContenu() {
		return sdd && (sdd.getElements().length || 0) * proprietes.hauteurDeLigne;
	}

	function identifierEltsSelectionnes(listeElements) {
		elementsSelectionnes = [];
		if (proprietes.modeDeSelection)
			for (var i = 0 ; i < listeElements.length ; i++) {
				if (elementsSelectionnes && listeElements[i][ESTSELECTIONNE]){
					if (proprietes.modeDeSelection.methode == "unique")
						delete listeElements[i][ESTSELECTIONNE];
					else
						elementsSelectionnes.push(listeElements[i]);
				}
				else if (listeElements[i][ESTSELECTIONNE])
					elementsSelectionnes = [listeElements[i]];
			}
		else
			for (var i = 0 ; i < listeElements.length ; i++)
				delete listeElements[i][ESTSELECTIONNE];
	}

	function deselectionner (donnee) {
		for (var i = 0 ; i < elementsSelectionnes.length ; i++)
			if (elementsSelectionnes[i] == donnee){
				delete elementsSelectionnes[i][ESTSELECTIONNE];
				elementsSelectionnes.splice(i, 1);
			}
	}

	function ObjStructure () {
		var structure = this;
		var nbColonnes = objEntete.construireHtml();
		var hauteurEntete = 25 + ($(objEntete.getHtml()).find(".ox-groupement").length ? 31 : 0);
		objDefilement.setHauteurConteneur($conteneur.height() - hauteurEntete);
		var nbLignesTableau = Math.ceil(objDefilement.getHauteurContenu() / proprietes.hauteurDeLigne);
		var listeLignes = new Array();

		function construireStructure () {
			function oxLigne () {
				var listeCellules = new Array();
				var donnees;
				var objEnteteGroupe;

				var ligne = document.createElement("div");
				ligne.className = "ox-ligne";
				ligne.style.height = proprietes.hauteurDeLigne + "px";
				ligne.style.lineHeight = proprietes.hauteurDeLigne + "px";
				function evtSelectionLigne (e) {
					if (donnees[NONSELECTIONNABLE])
						return;
					var eltSelectionne = donnees[ESTSELECTIONNE];
					if (e.shiftKey){
						var indexEltClicke = sdd.getIndex(donnees, true);
						var indexDernierElt = elementsSelectionnes ? sdd.getIndex(elementsSelectionnes[elementsSelectionnes.length - 1], true) : 0;
						var nbEltsVoulus = Math.abs(indexDernierElt - indexEltClicke);
						var indexPremierElt = indexDernierElt < indexEltClicke ? indexDernierElt + 1 : indexEltClicke;
						donnees = sdd.getElements(null, indexPremierElt, nbEltsVoulus);
					}
					if (eltSelectionne && elementsSelectionnes.length > 1) {
						for (var i = 0 ; i < elementsSelectionnes.length ; i++)
							instance.deselectionner(elementsSelectionnes[i]);
						instance.selectionner(donnees, e.ctrlKey || e.shiftKey);
					}
					else if (!eltSelectionne)
						instance.selectionner(donnees, e.ctrlKey || e.shiftKey);
					else
						instance.deselectionner(donnees);
				}
				ligne.addEventListener("click", evtSelectionLigne);

				objEntete.fairePourChaqueColonne(function(objColonne) {
					if (!objColonne[ESTAFFICHEE])
						return;
					listeCellules.push(new oxCellule(objColonne));
				});
				$($(ligne).find(".ox-colonne").get(0)).width($($(ligne).find(".ox-colonne").get(0)).width() + 1);		// pas de bord sur la première cellule

				function oxCellule (objColonne) {
					var cellule = document.createElement("div");
					cellule.className = "ox-colonne" + ' ox-' + (objColonne[ALIGNEMENT] || proprietes[ALIGNEMENT]);
					ligne.appendChild(cellule);
					cellule.style.width = objColonne.largeurReelle - 1 + "px";
					cellule.style.height = proprietes.hauteurDeLigne - 1 + "px";
					function evtSelectionColonne (e) {

					}
					function celluleSourisEntre(e) {
						if (infoBulle)
							infoBulle.setTexte(getTexte());
					}
					function celluleSourisDeplacee(e) {
						if (infoBulle)
							infoBulle.positionner(e.clientY, e.clientX);
					}
					function celluleSourisSort (e) {
						if (infoBulle)
							infoBulle.masquer();
					}
					cellule.addEventListener("click", evtSelectionColonne);
					cellule.addEventListener("mouseover", celluleSourisEntre);
					cellule.addEventListener("mousemove", celluleSourisDeplacee);
					cellule.addEventListener("mouseout", celluleSourisSort);

					function getTexte () {
						var texte = donnees[objColonne[REFERENCE]];
						if (objColonne[FORMAT] == "date") {
							texte = texte.toLocaleDateString("fr-FR", objColonne[AFFICHAGEDATE]);
							texte = texte == "Invalid Date" ? '' : texte;
						}
						if (objColonne[FORMAT] == "temps") {
							texte = texte.toLocaleTimeString("fr-FR", objColonne[AFFICHAGEDATE]);
							texte = texte == "Invalid Date" ? '' : texte;
						}
						return objColonne[PREFIXE] + ' ' + texte + ' ' + objColonne[SUFFIXE];
					}

					this.rafraichir = function () {
						cellule.innerHTML = getTexte();
					}

					this.redimensionner = function (largeur) {
						cellule.style.width = largeur + "px";
					}

					this.getHtml = function (largeur) {
						return cellule;
					}

					this.detruire = function () {
						cellule.removeEventListener("click", evtSelectionColonne);
						cellule.removeEventListener("mouseover", celluleSourisEntre);
						cellule.removeEventListener("mousemove", celluleSourisDeplacee);
						cellule.removeEventListener("mouseout", celluleSourisSort);
						cellule.remove();
					}
				}

				function oxEnteteGroupe (donneesGroupe) {
					donneesGroupe[NONSELECTIONNABLE] = true;
					//delete donneesGroupe[ESTSELECTIONNE];
					var nomColonne;
					objEntete.fairePourChaqueColonne(function (donnees) {								// on recherche le nom de la colonne
						if (donneesGroupe.OxNomProp == donnees[REFERENCE])
							nomColonne = donnees[NOM];
					});
					var htmlEnteteGroupe = document.createElement("div");
					htmlEnteteGroupe.className = "ox-nomGroupe"
					htmlEnteteGroupe.innerHTML = "<div class = 'ox-infoOuvertureGroupe'></div><span class = 'ox-nonEnteteGroupe'>" +
													nomColonne + "</span>: " + donneesGroupe.OxCritere +
													"<span class = 'ox-nbEltGroupe'>" + donneesGroupe.OxNbElements + " éléments</span>";
					//ligne.className = ligne.className.replace(/ ?ox-enteteGroupe/g, '').replace(/ ?ox-groupeNiveau\d+/g, '');
					ligne.className = ligne.className + " ox-enteteGroupe ox-groupeNiveau" + donneesGroupe.OxNiveauGroupe;
					ligne.appendChild(htmlEnteteGroupe);
					function evtSelectionGroupe (e) {
						donneesGroupe.OxDeploye = !donneesGroupe.OxDeploye;
						if (donneesGroupe.OxDeploye)
							$(htmlEnteteGroupe).find(".ox-infoOuvertureGroupe").addClass("ox-deploye");
						else
							$(htmlEnteteGroupe).find(".ox-infoOuvertureGroupe").removeClass("ox-deploye");
						nbEltAffichables = donneesGroupe.OxCalculerDonneesAffichables(donneesGroupe).length;
						objDefilement.setHauteurContenu(nbEltAffichables * proprietes.hauteurDeLigne);
						structure.rafraichir();
					}
					htmlEnteteGroupe.addEventListener("click", evtSelectionGroupe);

					this.detruire = function () {
						ligne.className = ligne.className.replace(/ ?ox-enteteGroupe/g, '').replace(/ ?ox-groupeNiveau\d+/g, '');
						htmlEnteteGroupe.removeEventListener("click", evtSelectionGroupe);
						htmlEnteteGroupe.remove();
					}
				}

				this.getHtml = function () {
					return ligne;
				}

				this.getListeCellules = function () {
					return listeCellules;
				}

				this.afficher = function () {
					ligne.style.display = "block";
				}

				this.masquer = function () {
					ligne.style.display = "none";
				}

				this.detruire = function () {
					ligne.removeEventListener("click", evtSelectionLigne);
					for (var i = 0 ; i < listeCellules.length ; i++)
						listeCellules[i].detruire();
					objEnteteGroupe && objEnteteGroupe.detruire();
					ligne.remove();
				}

				this.setDonnees = function (d) {
					donnees = d;
					objEnteteGroupe && objEnteteGroupe.detruire();
					if (donnees.OxEnteteGroupe)
						objEnteteGroupe = new oxEnteteGroupe(donnees);
					else
						for (var i = 0 ; i < listeCellules.length ; i++)
							listeCellules[i].rafraichir();
					ligne.className = ligne.className.replace(/ ?ox-nonSelectionnable/g, '');
					if (donnees[NONSELECTIONNABLE])
						ligne.className = ligne.className + " ox-nonSelectionnable";
					ligne.className = ligne.className.replace(/ ?ox-selectionne/g, '');
					if (donnees[ESTSELECTIONNE])
						ligne.className = ligne.className + " ox-selectionne";
					ligne.className = ligne.className.replace(donnees[CLASSELIGNE], '');
					if (donnees[CLASSELIGNE])
						ligne.className += ' ' + donnees[CLASSELIGNE];
				}
			}
			$conteneur.prepend(objEntete.getHtml());
			for (var i = 0 ; i < nbLignesTableau ; i++) {
				listeLignes.push(new oxLigne());
				objDefilement.getContenu().append(listeLignes[listeLignes.length - 1].getHtml());
			}
		}

		function vider () {
			for (var i = 0 ; i < listeLignes.length ; i++)
				listeLignes[i].detruire();
			listeLignes = new Array();
		}

		construireStructure();

		this.getNbEltsAffiches = function () {
			return nbLignesTableau;
		}

		this.getListeLignes = function () {
			return listeLignes;
		}

		this.setNbLignesTableau = function (nbLignes) {
			return nbLignesTableau = nbLignes;
		}

		this.redimensionner = function (hauteur) {
			hauteur && objDefilement.setHauteurConteneur(hauteur - objEntete.getHtml().clientHeight);
			nbLignesTableau = Math.ceil(objDefilement.getHauteurContenu() / proprietes.hauteurDeLigne);
			objEntete.reinitialiser();
			structure.rafraichir();
		}

		this.remplir = function () {
			var listeAParcourir = sdd.getElements();
			for (var i = 0 ; i < nbLignesTableau ; i++) {
				if (i + positionVue < listeAParcourir.length) {
					listeLignes[i].afficher();
					listeLignes[i].setDonnees(listeAParcourir[i + positionVue]);
				}
				else
					listeLignes[i].masquer();
			}
		}

		this.changerHauteurLigne = function (hauteur) {
			nbLignesTableau = Math.ceil(objDefilement.getHauteurContenu() / proprietes.hauteurDeLigne);
			structure.rafraichir();
		}

		this.rafraichir = function () {
			vider();
			construireStructure();
			afficher(positionVue);
		}

		this.detruire = function () {
			listeLignes.forEach(function (ligne) {
				ligne.detruire();
			});
		}
	}

	this.filtrer = function (objColonne, texte) {
		sdd.filtrer(null, objColonne[REFERENCE], texte);
	}

	this.trier = function (objColonne, sens, cumul) {
		if (!objEntete.estTriable(objColonne))
			return;
		sdd.trier(null, objColonne[REFERENCE], sens, cumul);
	}

	this.grouper = function (listeObjsColonne) {
		var listePropDeRegroup = [];
		for (var i = 0; i < listeObjsColonne.length; i++)
			listePropDeRegroup.push(REFERENCE);
		sdd.grouper(null, listeObjsColonne/*[listeObjsColonne.length - 1][REFERENCE]*/, listePropDeRegroup);
	}

	function initialiser () {
		creerSourceDeDonnees(proprietes.sourceDeDonnees);
		nbEltAffichables = sdd.getElements().length;

		objEntete = new ObjEntete();

		($conteneur.get(0).className += " ox-tableau").replace(/^ /, '');
		contenu = document.createElement("div");
		contenu.style.height = $conteneur.height() + "px";
		contenu.style.width = $conteneur.width() + "px";
		$conteneur.get(0).appendChild(contenu);
		$(contenu).OxDefilement({ hauteurContenu: calculerHauteurContenu(), largeurContenu: $conteneur.width(),
			deplacementBoutonY: function (position, orgEvt) {
				if (orgEvt == "utilisateur") {
					var pos = Math.max(Math.round((nbEltAffichables - objStructure.getNbEltsAffiches()) * position), 0);
					afficher(pos);
					if (position == 1) {
						var nbLignesTableau = objStructure.getNbEltsAffiches();//Math.ceil(objDefilement.getHauteurContenu() / proprietes.hauteurDeLigne);
						var differenceHauteur = objDefilement.getHauteurContenu() - nbLignesTableau * proprietes.hauteurDeLigne;
						objDefilement.getContenu().get(0).children[0].style.marginTop = differenceHauteur + "px";
					}
					else
						objDefilement.getContenu().get(0).children[0].style.marginTop = 0;
				}
			},
			deplacementBoutonX: function (position, orgEvt) {
				if (typeof objDefilement == "undefined" || !objStructure)
					return;
				var listeLignes = objDefilement.getContenu().get(0).children;
				var listeColonnes = objDefilement.getContenu().get(0).children[0].children;
				var nbEltsAParcourir = listeColonnes.length;
				var estGroupe = ~listeColonnes[listeColonnes.length - 1].className.indexOf("ox-nomGroupe") ? true : false;
				if (estGroupe)
					nbEltsAParcourir--;
				var longueurLigne = 0;
				for (var i = 0 ; i < nbEltsAParcourir ; i++) {
					var affActuel = listeColonnes[i].style.display;
					estGroupe && (listeColonnes[i].style.display = "block");
					longueurLigne += listeColonnes[i].clientWidth + 1;
					estGroupe && (listeColonnes[i].style.display = affActuel);
				}
				var differenceLargeur = objDefilement.getLargeurContenu() - longueurLigne;
				for (var i = 0 ; i < listeLignes.length ; i++)
					listeLignes[i].style.marginLeft = differenceLargeur * position + "px";

				objEntete.getHtml().style.marginLeft = differenceLargeur * position + "px";
			},
			retaillageHauteurContenu: function (hauteur) {
				if (typeof objStructure != "undefined") {
					objStructure.setNbLignesTableau(Math.ceil(hauteur / proprietes.hauteurDeLigne));
					typeof objStructure != "undefined" && objStructure.rafraichir();
				}
			}
		});
		objDefilement = $(contenu).data("OxDefilement");

		objStructure = new ObjStructure();

		if (proprietes.infosBulles)
			infoBulle = new InfoBulle();

		objDefilement.setHauteurConteneur($conteneur.height() - objEntete.getHtml().clientHeight);
		objDefilement.setLargeurContenu(objEntete.getLargeur());

		identifierEltsSelectionnes(sdd.getElements());

		var listeGroupes = new Array();
		var et = proprietes.etatInitial;
		if (et && et.length) {
			for (var i = 0 ; i < et.length ; i++)
				if (et[i].action == "groupe")
					listeGroupes.push(objEntete.getColonne(et[i].colonne));
			instance.grouper(listeGroupes);
			for (var i = 0 ; i < et.length ; i++)
				if (et[i].action == "tri")
					instance.trier(objEntete.getColonne(et[i].colonne), et[i].sens, true);
			objEntete.getregroupement().construireRegroupement(listeGroupes);
		}

		afficher();
	}

	function afficher (position = 0) {
		var nbEltsAffiches = objStructure.getNbEltsAffiches();
		positionVue = position;

		objStructure.remplir();
	}

	function getOffsetOrigineEcran (noeud) {
		var noeudParent = noeud.parentNode;
		var offset = { gauche: noeud.offsetLeft, haut: noeud.offsetTop };
		while(noeudParent.nodeName != "BODY") {
			offset.gauche += noeudParent.offsetLeft;
			offset.haut += noeudParent.offsetTop;
			noeudParent = noeudParent.parentNode;
		}

		return offset;
	}

	this.getEltsSelectionnes = function () {
		return elementsSelectionnes;
	}

	this.getColonnes = function() {
		return objEntete.getColonnes();
	}

	this.getNbElements = function() {
		return sdd.getElements().length;
	}

	this.redimensionnerTableau = function(largeur, hauteur) {
		largeur && $conteneur.width(largeur);
		hauteur && $conteneur.height(hauteur);

		objDefilement.setHauteurConteneur(hauteur);
		objDefilement.setLargeurConteneur(largeur);
		objStructure.redimensionner(hauteur);
	}

	this.redimensionnerColonne = function(colonne, largeur) {
		if (colonne[ESTREDIMENSIONNABLE] == false || (!proprietes[ESTREDIMENSIONNABLE] && !colonne[ESTREDIMENSIONNABLE]))
			return;
		objEntete.modifierLargeur(colonne, largeur);
		objDefilement.setLargeurContenu(objEntete.getLargeur());
		var listeLignes = objStructure.getListeLignes();
		for (var i = 0 ; i < listeLignes.length ; i++)
			listeLignes[i].getListeCellules()[objEntete.getIndexColonne(colonne)].redimensionner(largeur - 1);
	}

	this.toutSelectionner = function () {
		if (proprietes.modeDeSelection.methode != "unique"){
			elementsSelectionnes = [];
			var listeElts = sdd.getElements();
			for (var i = 0 ; i < listeElts.length ; i++) {
				listeElts[i][ESTSELECTIONNE] = true;
				elementsSelectionnes.push(listeElts[i]);
			}
			afficher(positionVue);
			if (typeof proprietes.selection == "function")
				proprietes.selection(elementsSelectionnes, "systeme");
		}
	}

	this.selectionner = function (donnees, cumul) {
		/*if (!proprietes.modeDeSelection)
			return;*/
		donnees = Array.isArray(donnees) ? donnees : [donnees];
		if (proprietes.modeDeSelection.objet == "ligne")
			if (proprietes.modeDeSelection.methode == "unique" || !cumul){
				if (donnees[0][NONSELECTIONNABLE])
					return;
				for (var i = 0 ; i < elementsSelectionnes.length ; i++)
					delete elementsSelectionnes[i][ESTSELECTIONNE];
				elementsSelectionnes = [];
				elementsSelectionnes[0] = donnees[0];
				elementsSelectionnes[0][ESTSELECTIONNE] = true;
			}
			else{
				for (var i = 0 ; i < donnees.length ; i++){
					if (donnees[i][NONSELECTIONNABLE])
						continue;
					var estDejaPresent = false;
					for (var j = 0 ; elementsSelectionnes && j < elementsSelectionnes.length ; j++)				// vérification si déjà présent
						if (elementsSelectionnes[j] == donnees[i])
							estDejaPresent = true;
					if (estDejaPresent)
						continue;
					elementsSelectionnes ? elementsSelectionnes.push(donnees[i]) : (elementsSelectionnes = [donnees[i]]);
					donnees[i][ESTSELECTIONNE] = true;
				}
			}
		afficher(positionVue);
		if (typeof proprietes.selection == "function")
			proprietes.selection(donnees, getPileAppels()[1] == "evtSelectionLigne" ? "utilisateur" : "systeme");
	}

	this.toutDeselectionner = function () {
		if (proprietes.modeDeSelection.methode != "unique"){
			elementsSelectionnes = [];
			var listeElts = sdd.getElements();
			for (var i = 0 ; i < listeElts.length ; i++)
				listeElts[i][ESTSELECTIONNE] = false;
			afficher(positionVue);
			if (typeof proprietes.selection == "function")
				proprietes.selection(elementsSelectionnes, "systeme");
		}
	}

	this.deselectionner = function (donnees) {
		if (!elementsSelectionnes)
			return;
		donnees = Array.isArray(donnees) ? donnees : [donnees];
		if (proprietes.modeDeSelection.objet == "ligne")
			for (var i = 0 ; i < donnees.length ; i++)
				deselectionner(donnees[i]);
		if (!elementsSelectionnes.length)
			elementsSelectionnes = [];
		afficher(positionVue);
		if (typeof proprietes.deselection == "function")
			proprietes.deselection(donnees, getPileAppels()[1] == "evtSelectionLigne" ? "utilisateur" : "systeme");
	}

	this.changerDonnees = function (donnees) {
		creerSourceDeDonnees(donnees);
		delete elementsSelectionnes;
		positionVue = 0;
		nbEltAffichables = sdd.getElements().length;

		objDefilement.setHauteurConteneur($conteneur.height() - objEntete.getHtml().clientHeight);

		identifierEltsSelectionnes(sdd.getElements());

		afficher();
	}

	this.ajouterElements = function (donnees, indexDestination) {
		donnees = Array.isArray(donnees) ? donnees : [donnees];
		for (var i = 0 ; i < donnees.length ; i++) {
			if (elementsSelectionnes.length)
				delete donnees[i][ESTSELECTIONNE];
			else if (donnees[i][ESTSELECTIONNE])
				elementsSelectionnes = [donnees[i]];
		}
		sdd.ajouterElements(donnees, null, indexDestination);
		nbEltAffichables += donnees.length;
		objDefilement.setHauteurContenu(nbEltAffichables * proprietes.hauteurDeLigne);
		afficher(positionVue);
		if (typeof proprietes.ajout == "function")
			proprietes.ajout(donnees);
	}

	this.supprimerElements = function (donnees) {
		donnees = Array.isArray(donnees) ? donnees : [donnees];
		for (var i = 0 ; i < donnees.length ; i++) {
			if (elementsSelectionnes) {
				deselectionner(donnees[i]);
				if (!elementsSelectionnes.length)
					elementsSelectionnes = [];
			}
			if (sdd.supprimerElement(donnees[i]) >= 0)
				nbEltAffichables--;
		}
		objDefilement.setHauteurContenu(nbEltAffichables * proprietes.hauteurDeLigne);
		afficher(positionVue);
		if (typeof proprietes.suppression == "function")
			proprietes.suppression(donnees);
	}

	this.modifierElements = function (donnees, nvlDonnees) {
		donnees = Array.isArray(donnees) ? donnees : [donnees];
		nvlDonnees = Array.isArray(nvlDonnees) ? nvlDonnees : [nvlDonnees];
		for (var i = 0 ; i < donnees.length ; i++)
			sdd.modifierElement(donnees[i], nvlDonnees[i]);
		afficher(positionVue);
		if (typeof proprietes.modification == "function")
			proprietes.modification(donnees);
	}

	this.mettreAJourElements = function (donnees, prop) {
		donnees = Array.isArray(donnees) ? donnees : [donnees];
		for (var i = 0 ; i < donnees.length ; i++)
			sdd.modifierElement(sdd.getElement(null, prop, donnees[i][prop]), donnees[i]);
		afficher(positionVue);
		if (typeof proprietes.modification == "function")
			proprietes.modification(donnees);
	}

	this.deplacerElements = function (donnees, indexDestination) {
		donnees = Array.isArray(donnees) ? donnees : [donnees];
		for (var i = 0 ; i < donnees.length ; i++)
			sdd.deplacerElement(donnees[i], null, indexDestination);
		afficher(positionVue);
		if (typeof proprietes.deplacement == "function")
			proprietes.deplacement(donnees);
	}

	this.modifierAlignement = function (objColonne, valeur) {
		(objColonne || proprietes)[ALIGNEMENT] = valeur;
		objStructure.rafraichir();
	}

	this.vider = function () {
		sdd.supprimerFils();
		objStructure.rafraichir();
	}

	this.changerModeDeSelection = function (mode) {
		proprietes.modeDeSelection = mode;
		identifierEltsSelectionnes(sdd.getElements());
		afficher(positionVue);
	}

	this.gererAffichageColonne = function (objColonne, affichage) {
		objColonne[ESTAFFICHEE] = affichage;
		objEntete.reinitialiser();
		objStructure.rafraichir();
		objDefilement.setLargeurContenu(objEntete.getLargeur());
	}

	this.changerHauteurLigne = function (hauteur) {
		proprietes.hauteurDeLigne = hauteur;
		objStructure.changerHauteurLigne(hauteur);
		objDefilement.setHauteurContenu(nbEltAffichables * proprietes.hauteurDeLigne);
	}

	this.gererPossibiliteRedim = function (objColonne, etat) {
		(objColonne ? objColonne : proprietes)[ESTREDIMENSIONNABLE] = etat;
		objEntete.masquerRedimensionneur();
	}

	this.gererPossibiliteTri = function (objColonne, etat) {
		(objColonne ? objColonne : proprietes)[ESTTRIABLE] = etat;
		if (objColonne)
			objColonne.html.className = objColonne.html.className.replace(/ ?ox-estTriable/g, '');
		else
			objEntete.getColonnes().forEach(function(objColonne) {
				objColonne.html.className = objColonne.html.className.replace(/ ?ox-estTriable/g, '');
			});
	}

	this.getConteneur = function() {
		return $conteneur;
	}

	this.getIndexElements = function (listeElements) {
		if (!listeElements)
			return [];

		var listeIndex = new Array();
		for (var i = 0 ; i < listeElements.length ; i++)
			listeIndex.push(sdd.getIndex(listeElements[i]));

		return listeIndex;
	}

	this.getSourceDeDonnees = function () {
		return sdd;
	}

	this.rafraichir = function (hauteur) {
		objStructure.rafraichir();
	}

	this.exporterVersExcel = function (exporterSelection) {
		var exportExcel = '';
		var colonnesAExporter = [];
		var donneesAExporter = exporterSelection ? instance.getEltsSelectionnes() : sdd.getElements();

		function formatterTexte (obj, objRef) {
			var texte = obj[objRef.ref];
			if (objRef.format == "date") {
				texte = texte.toLocaleDateString("fr-FR", obj[AFFICHAGEDATE]);
				texte = texte == "Invalid Date" ? '' : texte;
			}
			if (objRef.format == "temps") {
				texte = texte.toLocaleTimeString("fr-FR", obj[AFFICHAGEDATE]);
				texte = texte == "Invalid Date" ? '' : texte;
			}
			obj[PREFIXE] && (texte = obj[PREFIXE] + ' ' + texte);
			obj[SUFFIXE] && (texte = texte + ' ' + obj[SUFFIXE]);
			return texte;
		}

		objEntete.fairePourChaqueColonne(function (objColonne) {
			if (objColonne[ESTAFFICHEE]) {
				colonnesAExporter.push({ ref: objColonne[REFERENCE], format: objColonne[FORMAT]});
				exportExcel += "\"" + objColonne[NOM] + "\";";
			}
		});
		exportExcel = exportExcel.replace(/;$/, '\n');							// on vire le dernier ;
		donneesAExporter.forEach(function(ligne) {
			for (var i = 0 ; i < colonnesAExporter.length ; i++)
				exportExcel += "\"" + formatterTexte(ligne, colonnesAExporter[i]) + "\";";
			exportExcel = exportExcel.replace(/;$/, '\n');
		});
		return exportExcel;
	}

	this.detruire = function (conserverBalise) {
		objEntete.detruire();
		objStructure.detruire();
		objDefilement && objDefilement.detruire();
		objDefilement = undefined;
		infoBulle.detruire();
		!conserverBalise && $conteneur.remove();
	}

	function ObjEntete() {
		var entete = this;
		var html = document.createElement("div");
		html.className = "ox-enteteTableau";
		var listeColonnes = proprietes.entetes;
		var largeurEntete = 0;
		var curseurDeRedimensionnement = new objRedimensionneur();
		var regroupement;

		var objColonne = {
			nom: '',
			format: "texte",
			largeur: 0,
			estTriable: true,
			estFiltrable: true,
			estGroupable: false,
			estAffichee: true,
			//estRedimensionnable: false,			ne doit pas être définit à ce niveau la par défaut
			prefixe: '',
			suffixe: ''
		};

		function definirLargeurColonnes() {
			var largeurTableau = $conteneur.width();
			largeurEntete = 0;
			var nbColonnesIndefinies = 0;										// nombre de colonnes dont la largeur n'a pas été définies
			for (var i = 0 ; i < listeColonnes.length ; i++){
				if (listeColonnes[i][ESTAFFICHEE] == false)
					continue;
				listeColonnes[i].largeurReelle = listeColonnes[i][LARGEUR];
				if (~listeColonnes[i][LARGEUR].toString().search(/px/))
					listeColonnes[i].largeurReelle = parseFloat(listeColonnes[i][LARGEUR].replace(/px|pt/g, ''));
				if (~listeColonnes[i][LARGEUR].toString().search(/%/))
					listeColonnes[i].largeurReelle = parseFloat(/\d+/.exec(listeColonnes[i][LARGEUR])[0]) * largeurTableau / 100;
				if (!listeColonnes[i][LARGEUR])
					nbColonnesIndefinies++;
				else
					largeurEntete += listeColonnes[i].largeurReelle;
			}
			var espaceRestant = 0;
			if (nbColonnesIndefinies)
				for (var i = 0 ; i < listeColonnes.length ; i++){
					if (listeColonnes[i][ESTAFFICHEE] == false)
						continue;
					if (!listeColonnes[i][LARGEUR]){
						listeColonnes[i].largeurReelle = (largeurTableau - largeurEntete) / nbColonnesIndefinies;
						if (listeColonnes[i].largeurReelle < 40)
							listeColonnes[i].largeurReelle = 40;
						espaceRestant += listeColonnes[i].largeurReelle;
					}
				}
			largeurEntete += espaceRestant;
		}

		(function initialiser() {
			for (var i = 0 ; i < listeColonnes.length ; i++)
				listeColonnes[i] = $.extend({}, objColonne, listeColonnes[i]);
			definirLargeurColonnes();
		})();

		function vider() {
			html.innerHTML = '';
		}

		function estRedimensionnable (objColonne) {
			if (objColonne[ESTREDIMENSIONNABLE] == false)
				return false;
			else if (objColonne[ESTREDIMENSIONNABLE] == true)
				return true;
			else if (proprietes[ESTREDIMENSIONNABLE] == true)
				return true;
			return false;
		}

		function survoleNomColonne (e) {
			var balise = this;
			var infos = $(balise).data("infos");
			if (estRedimensionnable(infos))
				curseurDeRedimensionnement.setParametres(balise.offsetLeft - 6 + balise.offsetWidth, balise.offsetLeft, function (nouvelleLargeur) {
					instance.redimensionnerColonne(infos, nouvelleLargeur - balise.offsetLeft)
				});
			if (infoBulle)
				infoBulle.setTexte(infos[NOM]);
		}

		function nomColonneDeplacee(e) {
			if (infoBulle)
				infoBulle.positionner(e.clientY, e.clientX);
		}

		function nomColonneSourisSort (e) {
			if (infoBulle)
				infoBulle.masquer();
		}

		function clickNomColonne (e) {
			var balise = this;
			var infos = $(balise).data("infos");
			if (entete.estTriable(infos))
				instance.trier(infos, infos.oxSensTri == "croissant" ? "decroissant" : infos.oxSensTri == "decroissant" ? null : "croissant", e.ctrlKey);
		}

		function clickGestionFenetreAnnexe (e) {
			e.stopPropagation();
			var infos = $(this).parent().data("infos");
			var decalageGauche = 0;
			entete.fairePourChaqueColonne(function (colonne, i) {
				if (colonne == infos)
					return false;
				decalageGauche += parseInt(colonne.html.style.width.replace("px", '')) + (i > 0 ? 1 : 0);
			});
			if (!fenetreAnnexe)
				fenetreAnnexe = new FenetreAnnexe();
			fenetreAnnexe.setParametres(infos, decalageGauche, entete.getHtml().clientHeight);
			fenetreAnnexe.montrer();
		}

		this.estTriable = function (objColonne) {
			if (objColonne[ESTTRIABLE] == false)
				return false;
			else if (objColonne[ESTTRIABLE] == true)
				return true;
			else if (proprietes[ESTTRIABLE] == true)
				return true;
			return false;
		}

		this.estFiltrable = function (objColonne) {
			if (objColonne[ESTFILTRABLE] == false)
				return false;
			else if (objColonne[ESTFILTRABLE] == true)
				return true;
			else if (proprietes[ESTFILTRABLE] == true)
				return true;
			return false;
		}

		this.reinitialiser = function () {
			definirLargeurColonnes();
			entete.construireHtml();
		}

		/*
			on vire les marques de tri, filtre, ...
		*/
		/*this.reinitialiserAffichageEntete = function () {
			for (var i = 0 ; i < listeColonnes.length ; i++){
				delete listeColonnes[i].oxSensTri;
				listeColonnes[i].html.className = listeColonnes[i].html.className.replace(/ ?ox-tri\w+/g, '');
				listeColonnes[i].html.textContent = listeColonnes[i][NOM];
				/!*if (proprietes.estTriable)															// TODO à corriger
					listeColonnes[i].html.textContent.appendChild(activationFiltre);*!/
			}
		}*/

		this.reinitialiserAffichageEntete = function (listeActions) {
			// on nettoie tous les marqueurs
			for (var i = 0 ; i < listeColonnes.length ; i++) {
				var objColonne = listeColonnes[i];
				delete objColonne.oxSensTri;
				//objColonne.html.textContent = objColonne[NOM];
				$(objColonne.html).find(".ox-marqueurTri").remove();
				objColonne.html.className = objColonne.html.className.replace(/ ?ox-filtre| ?ox-tri\w+/g, '');
				$(objColonne.html).find(".ox-activationFiltre").removeClass("ox-filterEnCours");
			}
			for (var i = 0 ; i < listeActions.length ; i++)
			{
				var critere = Object.keys(listeActions)[0];
				var infos = listeActions[i];
				parent = listeActions;
				for (var j = 0 ; j < listeColonnes.length ; j++)
					if (listeColonnes[j][REFERENCE] == infos.nomProp) {
						var objColonne = listeColonnes[j];
						var html = objColonne.html;
						if (infos.action == "filtre")
							$(html).find(".ox-activationFiltre").addClass("ox-filterEnCours");
						else if (infos.action == "tri"/* || infos.action == "groupe"*/) {
							objColonne.oxSensTri = infos.sens;
							html.className = html.className.replace(/ ?ox-tri\w+/g, '') + " ox-tri" + infos.sens[0].toUpperCase() + infos.sens.substring(1);
							$(html).prepend("<div class = 'ox-marqueurTri'></div>");
						}
						break;
					}
			}
		}

		this.construireHtml = function () {
			vider();

			if (proprietes[ESTGROUPABLE])
				regroupement = new objRegroupement();
			for (let i = 0 ; i < listeColonnes.length ; i++)
				if (listeColonnes[i][ESTAFFICHEE]) {
					let colonne = document.createElement("div");
					colonne.textContent = listeColonnes[i][NOM];
					colonne.className = "ox-enteteTab";
					$(colonne).data("infos", listeColonnes[i]);

					let activationFiltre = document.createElement("div");
					activationFiltre.className = "ox-activationFiltre";
					colonne.prepend(activationFiltre);
					activationFiltre.addEventListener("click", clickGestionFenetreAnnexe);
					if (entete.estFiltrable(listeColonnes[i]))
						colonne.className += " ox-estFiltrable";

					if (entete.estTriable(listeColonnes[i]))
						colonne.className += " ox-estTriable";
					colonne.style.width = listeColonnes[i].largeurReelle - (i == 0 ? 0 : 1) + "px";		// si première colonne pas de bord
					listeColonnes[i].html = colonne;
					html.appendChild(colonne);

					colonne.addEventListener("mouseover", survoleNomColonne);
					colonne.addEventListener("click", clickNomColonne);
					colonne.addEventListener("mousemove", nomColonneDeplacee);
					colonne.addEventListener("mouseout", nomColonneSourisSort);
				}
			html.style.width = largeurEntete + "px";
			if (proprietes[ESTGROUPABLE])
				regroupement.creerEvenements();
			return listeColonnes.length;
		}

		this.fairePourChaqueColonne = function (fonctionDeRetour) {
			for (var i = 0 ; i < listeColonnes.length ; i++)
				if (fonctionDeRetour(listeColonnes[i], i) == false)
					return;
		}

		this.masquerRedimensionneur = function () {
			curseurDeRedimensionnement.setParametres(-5);
		}

		this.getColonne = function (referenceColonne) {
			for (var i = 0 ; i < listeColonnes.length ; i++)
				if (listeColonnes[i][REFERENCE] == referenceColonne)
					return listeColonnes[i];
			return null;
		}

		this.getColonnes = function () {
			return listeColonnes;
		}

		this.getIndexColonne = function (colonne) {
			return listeColonnes.indexOf(colonne);
		}

		this.modifierLargeur = function (objColonne, largeur) {
			largeurEntete -= objColonne.largeurReelle - largeur;
			html.style.width = largeurEntete + "px";
			objColonne.largeurReelle = largeur;
			objColonne.html.style.width = largeur - 1 + "px";
		}

		this.getLargeur = function () {
			return largeurEntete;
		}

		this.getHauteur = function () {
			return html.style.height;
		}

		this.getHtml = function () {
			return html;
		}

		this.getregroupement = function () {
			return regroupement;
		}

		this.detruire = function () {
			listeColonnes.forEach(function (colonne) {
				colonne.html.removeEventListener("mouseover", survoleNomColonne);
				colonne.html.removeEventListener("click", clickNomColonne);
				colonne.html.removeEventListener("mousemove", nomColonneDeplacee);
				colonne.html.removeEventListener("mouseout", nomColonneSourisSort);
				colonne.html.getElementsByClassName("ox-activationFiltre")[0].removeEventListener("click", clickGestionFenetreAnnexe);
			});
			regroupement && regroupement.detruire();
			curseurDeRedimensionnement.detruire();
			html.remove();
		}

		function objRegroupement () {
			var regroupement = this;
			var htmlRegroupement = document.createElement("div");
			htmlRegroupement.className = "ox-groupement";
			htmlRegroupement.innerText = "Déposez ici un entête de colonne pour créer un regroupement.";
			html.appendChild(htmlRegroupement);
			var listeGroupes = new Array ();
			var objetEnCoursDeDeplacement;

			function estPresent (objEntete) {
				for (var i = 0 ; i < listeGroupes.length ; i++)
					if (listeGroupes[i].getObjet() == objEntete)
						return true;
				return false;
			}

			function getHierarchieGroupement () {
				var hierarchieGroupement = new Array();

				for (var i = 0 ; i < listeGroupes.length ; i++)
					hierarchieGroupement.push(listeGroupes[i].getObjet());

				return hierarchieGroupement;
			}

			function deplacer (e) {
				if (objetEnCoursDeDeplacement) {
					$(htmlRegroupement).find(".ox-groupeTemporaire").remove();
					var pos = 0, xMilieuGroupe;
					var posCurX = e.clientX || e.originalEvent.clientX;
					for (var i = 0 ; i < htmlRegroupement.children.length - 1 ; i++)					// -1 car le déplacement génère un noeud supplémentaire
						if (posCurX >= htmlRegroupement.children[i].offsetLeft && posCurX > 0){
							pos = i;
							xMilieuGroupe = htmlRegroupement.children[i].offsetLeft + htmlRegroupement.children[i].offsetWidth / 2;
						}
					if (posCurX > xMilieuGroupe)
						$(htmlRegroupement.children[pos]).after("<span class = 'ox-groupeTemporaire'>&nbsp;</span>");
					else
						$(htmlRegroupement.children[pos]).before("<span class = 'ox-groupeTemporaire'>&nbsp;</span>");
				}
			}
			htmlRegroupement.addEventListener("mousemove", deplacer);

			this.creerEvenements = function () {
				for (let i = 0 ; i < listeColonnes.length ; i++) {
					$(listeColonnes[i].html).data("objet", listeColonnes[i]);
					$(listeColonnes[i].html).draggable({
						start: function() {
							if (estPresent(listeColonnes[i]))
								return false;
						},
						revert: "invalid",
						helper: function() {
							return $( "<span class='ox-enteteADeplacer'>" + listeColonnes[i][NOM] + "</span>" );
						}
					});
				}

				$(htmlRegroupement).droppable({
					drop: function(e, ui) {
						if (!htmlRegroupement.children.length)
							htmlRegroupement.innerText = '';
						var objEntete = ui.draggable.data("objet");
						if (objEntete) {															// ajout d'un nouvel élément
							var groupe = new objGroupe(objEntete);
							listeGroupes.push(groupe);
							htmlRegroupement.appendChild(groupe.getHtml());
							instance.grouper(getHierarchieGroupement());
						}
						else {																		// déplacement d'un élément déjà ajouté
							var indexEltDeRecup = 0, indexEltDeplace, xMilieuGroupe;
							$(htmlRegroupement).find(".ox-groupeTemporaire").remove();
							$(htmlRegroupement).find(".ui-draggable-dragging").remove();
							var posCurX = e.clientX || e.originalEvent.clientX;
							for (var i = 0 ; i < htmlRegroupement.children.length ; i++){
								if (posCurX >= htmlRegroupement.children[i].offsetLeft && posCurX > 0){
									indexEltDeRecup = i;
									xMilieuGroupe = htmlRegroupement.children[i].offsetLeft + htmlRegroupement.children[i].offsetWidth / 2;
								}
								if (listeGroupes[i].getHtml() == ui.draggable[0])
									indexEltDeplace = i;
							}
							var eltADeplacer = listeGroupes.splice(indexEltDeplace, 1);
							if (posCurX > xMilieuGroupe){
								if (htmlRegroupement.children[indexEltDeRecup] != objetEnCoursDeDeplacement)		// bug after avec jquery 1.7.1
									$(htmlRegroupement.children[indexEltDeRecup]).after(objetEnCoursDeDeplacement);
								listeGroupes.splice(indexEltDeplace > indexEltDeRecup ? indexEltDeRecup + 1 : indexEltDeRecup, 0, eltADeplacer[0]);
							}
							else{
								if (htmlRegroupement.children[indexEltDeRecup] != objetEnCoursDeDeplacement)
									$(htmlRegroupement.children[indexEltDeRecup]).before(objetEnCoursDeDeplacement);
								listeGroupes.splice(indexEltDeplace > indexEltDeRecup ? indexEltDeRecup : indexEltDeRecup - 1, 0, eltADeplacer[0]);
							}
							instance.grouper(getHierarchieGroupement());
						}
					}
				}).disableSelection();
			}

			this.construireRegroupement = function (listeRegroupement) {
				htmlRegroupement.innerText = '';
				listeRegroupement.forEach(function (regroupement) {
					var groupe = new objGroupe(regroupement);
					listeGroupes.push(groupe);
					htmlRegroupement.appendChild(groupe.getHtml());
				});
			}

			this.detruire = function () {
				htmlRegroupement.removeEventListener("mousemove", deplacer);
				htmlRegroupement.remove();
			}

			function objGroupe (objEntete) {
				var groupe = this;
				var htmlGroupe = document.createElement("span");
				htmlGroupe.className = "ox-groupe";
				htmlGroupe.innerHTML = objEntete[NOM];
				var fermetureGroupe = document.createElement("span");
				fermetureGroupe.className = "ox-fermetureGroupe";
				htmlGroupe.appendChild(fermetureGroupe);

				$(htmlGroupe).draggable({
					start: function () {
						objetEnCoursDeDeplacement = htmlGroupe;
					},
					stop: function () {
						$(htmlRegroupement).find(".ox-groupeTemporaire").remove();
						objetEnCoursDeDeplacement = null;
					},
					revert: "invalid",
					helper: "clone"
				});

				fermetureGroupe.addEventListener("click", detruire);

				function detruire () {
					for (var i = 0 ; i < listeGroupes.length ; i++)
						if (listeGroupes[i].getObjet() == objEntete)
							listeGroupes.splice(i, 1);
					fermetureGroupe.removeEventListener("click", detruire);
					htmlGroupe.remove();
					instance.grouper(getHierarchieGroupement());
					if (!htmlRegroupement.children.length)
						htmlRegroupement.innerText = "Déposez ici un entête de colonne pour créer un regroupement.";
				}

				this.getHtml = function () {
					return htmlGroupe;
				}

				this.getObjet = function () {
					return objEntete;
				}
			}
		}
	}

	function objRedimensionneur() {
		var redimensionneur = document.createElement("div");
		redimensionneur.className = "ox-redimensionneur";
		redimensionneur.draggable = true;
		$conteneur.get(0).appendChild(redimensionneur);
		var enCoursDeDeplacement = false;
		var positionMin;
		var envoyerNouvellePosition;

		function saisieRedimensionneur (e) {
			redimensionneur.style.borderRight = "1px dotted";
			enCoursDeDeplacement = true;
		}

		function relacheRedimensionneur (e) {
			enCoursDeDeplacement = false;
			redimensionneur.style.borderRight = "";
		}

		redimensionneur.addEventListener("mousedown", saisieRedimensionneur);

		redimensionneur.addEventListener("mouseup", relacheRedimensionneur);

		/*function dragstart (e) {
			e.dataTransfer.setData('text/plain', '');
		}
		function drag (e) {
			e.preventDefault();
		}*/

		$(redimensionneur).draggable({
			axis: "x",
			start: function() {
				enCoursDeDeplacement = true;
			},
			drag: function(e, ui) {
				var posCurX = e.clientX || e.originalEvent.clientX;
				if (posCurX - this.parentNode.offsetLeft < positionMin)
					ui.position.left = positionMin;
			},
			stop: function(e) {
				enCoursDeDeplacement = false;
				var posCurX = e.clientX || e.originalEvent.clientX;
				envoyerNouvellePosition(posCurX - getOffsetOrigineEcran(this.parentNode).gauche);
			}
		});

	//	redimensionneur.addEventListener('dragstart', dragstart);
	//	redimensionneur.addEventListener('drag', drag);
	//	redimensionneur.addEventListener("dragend", drop);

		this.setParametres = function (position, posMin, fonctionDeRetour) {
			if (enCoursDeDeplacement)
				return;
			redimensionneur.style.left = position + "px";
			positionMin = posMin;
			envoyerNouvellePosition = fonctionDeRetour;
		}

		this.detruire = function () {
			redimensionneur.removeEventListener("mousedown", saisieRedimensionneur);
			redimensionneur.removeEventListener("mouseup", relacheRedimensionneur);
			redimensionneur.remove();
		}
	}

	function InfoBulle (texte){
		var $conteneur = $("<div class = 'infoBulle'></div>");
		instance.getConteneur().append($conteneur);
		var delaiApparition;
		var delaiDisparition;

		this.setTexte = function (texte) {
			clearTimeout(delaiDisparition);
			$conteneur.html(texte);
			$conteneur.get(0).style.width = '';
			if ($conteneur.width() > 400)
				$conteneur.get(0).style.width = "400px";
			delaiApparition = setTimeout(function(){
				afficher();
			}, 500);
		}

		this.positionner = function (haut, gauche) {
			var posGauche = gauche + 15;
			$conteneur.get(0).style.top = haut + 15 + "px";
			$conteneur.get(0).style.left = posGauche + "px";
			if (posGauche + $conteneur.width() + 10 > window.innerWidth)
				$conteneur.get(0).style.left = window.innerWidth - $conteneur.width() - 10 + "px";
		}

		function afficher () {
			$conteneur.get(0).style.display = "block";
		}

		this.masquer = function () {
			clearTimeout(delaiApparition);
			delaiDisparition = setTimeout(function(){
				$conteneur.get(0).style.display = "none";
			}, 100);
		}

		this.detruire = function () {
			$conteneur.remove();
		}
	}

	function FenetreAnnexe () {
		var ifa = this;
		var objColonne;
		var $conteneur = $("<div class = 'fenetreAnnexe'></div>");
		var $filtre = $("<input type = 'text' name = 'filtre' />");
		var $actionFiltrer = $("<input type = 'button' value = 'Filtrer' />");
		var $actionReinitialiser = $("<input type = 'button' value = 'Réinitialiser' />");

		function empecherPropagationEvt (e) {
			e.stopPropagation();
		};

		function filtrer () {
			instance.filtrer(objColonne, $filtre.val());
			ifa.masquer();
		};

		function reinitialiserFiltre () {
			instance.filtrer(objColonne, '');
			ifa.masquer();
		};

		this.setParametres = function (objC, x, y) {
			objColonne = objC;
			$conteneur.css("left", x);
			$conteneur.css("top", y);
		};

		this.montrer = function () {
			var critereDeFiltre = "";
			sdd.getListeActionsDeSubsomption().forEach(function (action) {
				if (action.action == "filtre" && action.nomProp == objColonne[REFERENCE])
					critereDeFiltre = action.critere;
			});
			$filtre.val(critereDeFiltre);
			$conteneur.show({ effect: "blind", easing: "linear", duration: 200 });
			$filtre.focus();
		};

		this.masquer = function () {
			if ($conteneur.is(":visible"))
				$conteneur.hide({ effect: "blind", easing: "linear", duration: 200 });
		};

		this.detruire = function () {
			$conteneur.remove();
			$("html").off("click", ifa.masquer);
			$filtre.off("click", empecherPropagationEvt);
			$conteneur.off("click", empecherPropagationEvt);
			$conteneur.off("keypress");
			$actionFiltrer.off("click", filtrer);
			$actionReinitialiser.off("click", reinitialiserFiltre);
		};

		(function construire () {
			instance.getConteneur().append($conteneur);
			$conteneur.append($filtre);
			$conteneur.append($actionFiltrer);
			$conteneur.append($actionReinitialiser);

			$("html").on("click", ifa.masquer);
			$filtre.on("click", empecherPropagationEvt);
			$conteneur.on("click", empecherPropagationEvt);
			$conteneur.on("keypress", function (e) { if (e.which == 13) filtrer(); });
			$actionFiltrer.on("click", filtrer);
			$actionReinitialiser.on("click", reinitialiserFiltre);
		})();
	}

	initialiser();
}