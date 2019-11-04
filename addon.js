const { addonBuilder } = require("stremio-addon-sdk");
var request = require('request');

/*
        const meta = {
            id: 'tt1254207',
            name: 'Big Buck Bunny',
            year: 2008,
            poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/uVEFQvFMMsg4e6yb03xOfVsDz4o.jpg',
            posterShape: 'regular',
            banner: 'https://image.tmdb.org/t/p/original/aHLST0g8sOE1ixCxRDgM35SKwwp.jpg',
            type: 'movie'
		}
	*/
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
	"id": "community.yts",
	"version": "0.0.1",
	"catalogs": [{'type':'movie','id':'yts','name':'YTS',"extra": [
		{
		  "name": "genre",
		  "options": ['Action','Adventure','Animation','Biography','Comedy','Crime','Documentary','Drama','Family','Fantasy','Film Noir','History','Horror','Music','Musical','Mystery','Romance','Sci-Fi','Short Film','Sport','Superhero','Thriller','War','Western'],
		  "isRequired": false
		}
	  ]}],
	"resources": ["catalog"],
	"types": ['Movie'],
	"name": "YTS",
	"description": "YTS",
	"idPrefixes": [
		"tt"
	]
}
const builder = new addonBuilder(manifest)
function getMovies(page,cat=false){
	return new Promise((resolve, reject) => {
		request('https://yts.ae/api/v2/list_movies.json?'+(cat?'genre='+cat+'&':'')+'limit=50&page='+page, function (error, response, data) {	
			if (!error && response.statusCode == 200) {
				var jsonObject = JSON.parse(data)['data']['movies'];
				var metas = [];
				for (let i = 0; i < jsonObject.length; i++) {
					const item = jsonObject[i];
					metas.push({
						id:item.imdb_code,
						name:item.title,
						poster:'https://yts.ae'+item.large_cover_image,
						background:'https://yts.ae'+item.background_image_original,
						posterShape: 'regular',
						year:item.year,
						releaseInfo:item.year,
						released:item.date_uploaded,
						language:item.language,
						imdbRating:item.rating,
						runtime:item.runtime+'m',
						genres:item.genres,
						type:'movie'
					})
				}
				resolve(metas);
			}else{
				reject();
			}
		});
	});
}


// 
https://api.themoviedb.org
builder.defineCatalogHandler(function(args, cb) {
	// filter the dataset object and only take the requested type
	start = 1;
	cat = false;
	if(args.extra && args.extra.skip){
		start = Math.round(args.extra.skip/50)+1
	}
	if(args.extra && args.extra.genre){
		cat = args.extra.genre;
	}
	return new Promise((resolve, reject) => {
		Promise.all([getMovies(start,cat)]).then(function(values) {
			resolve({'metas':[].concat.apply([], values)});
		});
	});
});

module.exports = builder.getInterface()