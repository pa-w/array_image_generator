var aig = require ('array_image_generator');
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var sheet_id = '1mo9czjIQupWSkjyM--_RSusShy-WbHi8w28oBmxeufk';
var gAPIKey = require ('./gdrive.key.json');

var doc = new GoogleSpreadsheet (sheet_id)
var sheet, matrix = {};

var img = new aig ();
img.fileName ((row) => { 
	[date, time] = row.actualizacion.split (' ');
	[year,day,month] = date.split('/'), [hour,minute] = time.split(':');
	if (date && time) {
		return './output/'+ row.zona.toLowerCase ().replace(/ /g, '') + "-" + row.alerta.toLowerCase () + "-"  + year + month + day + hour + minute + ".png";
	}
	return './output/'+row.zona.toLowerCase().replace(/ /g, '') + "-" + row.zona.toLowerCase () + ".png";
} )
img.template ((row) => { console.log (row.alerta); return "./assets/alerta_" + row.alerta.toLowerCase () + '.png'; })
img.addFont ('regular', './assets/font-regular.ttf');
img.addFont ('bold', './assets/font-bold.ttf');

img.addColor ('white', {r: 255, g: 255, b: 255});
img.addColor ('bajo', {r: 209, g: 139, b: 36});
img.addColor ('medio', {r: 226, g: 111, b: 71});
img.addColor ('alto', {r: 221, g: 62, b: 62}); 
img.addColor ('urgente', {r: 221, g: 62, b: 62}); 

img.text ('alerta', {font: 'bold', size: 100, x: 50, y: 200, color: 'white', text: (a, r) => { return a.toUpperCase (); } });
img.text ('zona', {font: 'bold', size: (a, r) => { return a.length > 20 ? 43 : 48 }, x: 500, y: 150, color: 'white', text: (a, r) => { return a.toUpperCase (); } });
img.text ('direccion', { size: 25, x: 500, y: 210});
img.text ('detalle', { size: 25, x: 500, y: 245 });
img.text ('requeridos', {size: 20, x: 45, y: 460, text: (a, r) => { if (r.brigadistas && r.brigadistas[0] == 's') { a = "Se necesitan brigadistas." + a; }  a = a.replace (/\./g, ',');  return a.replace (/,/g, "\n")}, multiline: true });
img.text ('admitidos', { size: 20, x: 755, y: 460, text: (a, r) => { if (!a) return ''; a = a.replace (/\./g, ','); return a.replace(/,/g, "\n") }, multiline: true });
img.text ('no_requeridos', { size: 20, x: 1650, y: 500, text: (a, r) => { if (r.brigadistas && r.brigadistas[0] == 'n') { a = "No se necesitan brigadistas." + a; } a = a.replace (/\./g, ','); return a.replace(/,/g, "\n") }, multiline: true });
img.text ('actualizacion', { size: 70, x: 1550, y: 140, text: (a, r) => {[date, time] = a.split (' '); [year, day, month] = date.split('/'); return day + "." + month + " | " + time; }, color: (a, r) => { return r.alerta.toLowerCase(); } });

var translate = {"1": "alerta", "2": "brigadistas", "3": "requeridos", "4": "admitidos", "5": "no_requeridos", "6": "direccion", "7": "zona", "8": "detalle", "9": "actualizacion"};
var min_row = 5, max_row = 20;

async.series ([
	function setAuth (step) {
		doc.useServiceAccountAuth (gAPIKey, step);
		return step;
	},
	function getInfoAndWorksheets (step) {
		doc.getInfo((error, info) => { 
			sheet = info.worksheets [0];	
			step ();
		})
		
	},
	function workingWithCells (step) {
		sheet.getCells ({
			'min-row': min_row,
			'max-row': max_row
		}, (err, cells) => { 
			if (err) return; 
			for (var c in cells) {
				var cell = cells [c];
				if (!matrix [cell.row]) matrix [cell.row] = {};
				if (translate [cell.col]) {
					matrix [cell.row] [translate [cell.col]] = cell.value;
				}
			}
			step ();
		})
	},
	function workWithMatrix (step) {
		img.data (matrix);
		img.render (step);
	}
]);
