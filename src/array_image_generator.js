var fs = require ('fs');
var gd = require ('node-gd');
var Base = require ('./base');

function Array_Image_Generator () { 
	this._colors = {};
	this._fonts = {};
	this._textConf = {};
	this._rows = [];
	this.settersFromArray (["template", "fileName", "data"]);
}
Array_Image_Generator.prototype = Object.create (Base.prototype);
Array_Image_Generator.prototype.constructor = Array_Image_Generator;

Array_Image_Generator.prototype.text = function (id, conf) {
	this._textConf [id] = conf;
}
Array_Image_Generator.prototype.addFont = function (id, conf) { 
	this._fonts [id] = conf;
}
Array_Image_Generator.prototype.saveRow = function (row) { 
	this._rows.push (row);
}
Array_Image_Generator.prototype.addColor = function (id, conf) { 
	this._colors [id] = conf;
}
Array_Image_Generator.prototype.render = function (step) { 
	var matrix = this.data (), getTemplate = this.template ();
	var colors = {};
	var me = this;
	for (var r in matrix) {
		var row = matrix [r], imgFile = getTemplate (row); 
		if (fs.existsSync (imgFile)) {
			gd.openFile (imgFile, (err, img) => {
				for (var cl in me._colors) { 
					colors [cl] = img.colorAllocate (me._colors [cl].r, me._colors [cl].g, me._colors [cl].b);
				}
				if (err) throw err; 
				try {
					for (var cnf in this._textConf) { 
						var conf = this._textConf [cnf], 
							text = (conf.text ? (typeof conf.text === "function" ? conf.text (row [cnf], row) : conf.text) : row [cnf]),
							color = (conf.color ? (typeof conf.color === "function" ? conf.color (row [cnf], row) : conf.color ) : 'white' ),
							font = (conf.font ? (typeof conf.font === "function" ? conf.font (row [cnf], row) : conf.font ) : 'regular' ),
							size = (conf.size ? (typeof conf.size === "function" ? conf.size (row [cnf], row) : conf.size ) : 25 ),
							width = (conf.width ? (typeof conf.width === "function" ? conf.width (row [cnf], row) : conf.width ) : 0 ),
							x = (conf.x ? (typeof conf.x === "function" ? conf.x (row [cnf], row) : conf.x ) : 0 ),
							y = (conf.y ? (typeof conf.y === "function" ? conf.y (row [cnf], row) : conf.y ) : 0 )

						var getSizeToFit = (txt, width, size) => { 
							bboxWidth = 0; 
							do {
								[ll_x, ll_y, lr_x, lr_y, ur_x, ur_y, ul_x, ul_y] = img.stringFTBBox (colors [color], me._fonts [font], size, 0, parseInt (x), parseInt (y), txt);
								bboxWidth = lr_x - ll_x;
								size--;
							} while (bboxWidth > width);
							return size;
						}
						var lines = text.split ("\n");
						if (conf.multiline) { 
							for (var l in lines) { 
								var txt = lines [l].trim (), words = txt.split (' '), max_words = 6;
								var groups = words.map ( (e, i) => { return i % max_words === 0 ? words.slice (i, i + max_words) : null }).filter ((e) => {return e;}) 

								for (var g in groups ) {
									img.stringFT (colors [color], me._fonts [font], width > 0 ? getSizeToFit (groups [g].join (' '), width, size) : size, 0, parseInt (x), parseInt (y), groups [g].join (' ') );
									y += size + (size * .25);
								}
							}
						} else { 
							img.stringFT (colors [color], me._fonts [font], width > 0 ? getSizeToFit (text, width, size) : size, 0, parseInt (x), parseInt (y), text);
						}
					}

					var filePath = me.fileName () (row);
					row.file_path = filePath;
					me.saveRow (row);

					img.savePng (filePath, 1, function (err) {
						if (err)  { 
							console.log ("Could not save to: " + filePath);
							throw err;
						}
					});
				} catch (e) {
					console.log ("error: " + e)
					console.log (e.stack);
				}
			});
		} else {
			console.log ("404: template file " + imgFile);
		}
	}
	step ();
}

module.exports = Array_Image_Generator;
