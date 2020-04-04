const { addonBuilder } = require('stremio-addon-sdk')
const request = require('request')
const utils = require('./utils')
const package = require('./package.json')

const endpoint = 'https://yts.lt'

const oneDay = 24 * 60 * 60 // in seconds

const cache = {
	maxAge: 1.5 * oneDay, // 1.5 days
	staleError: 6 * 30 * oneDay // 6 months
}

const manifest = {
	id: 'community.yts',
	logo: 'https://i2.wp.com/fosslovers.com/wp-content/uploads/2019/01/YTS-logo.png',
	version: package.version,
	catalogs: [
		{
			type: 'movie',
			id: 'yts',
			name: 'YTS',
			extra: [
				{
		  			name: 'genre',
		  			options: ['Action','Adventure','Animation','Biography','Comedy','Crime','Documentary','Drama','Family','Fantasy','Film Noir','History','Horror','Music','Musical','Mystery','Romance','Sci-Fi','Short Film','Sport','Superhero','Thriller','War','Western'],
		  			isRequired: false
				}
	  		]
	  	}
	],
	resources: ['catalog', 'stream'],
	types: ['movie'],
	name: 'YTS',
	description: 'Movies and torrent results from YTS',
	idPrefixes: ['tt']
}

function getMovies(page, cat = false) {
	return new Promise((resolve, reject) => {

		const query = {
			genre: cat,
			limit: 50,
			sort_by: 'seeds',
			page
		}

		request(endpoint + '/api/v2/list_movies.json?' + utils.serialize(query), (error, response, data) => {	

			if (error || !data || response.statusCode != 200) {
				console.log({error});
				if(data) console.log({data});
				if(respose) console.log({response});
				reject('Invalid response from API for category: ' + (cat || 'top') + ' / page: ' + page)
				return
			}

			const jsonObject = JSON.parse(data)['data']['movies']

			const metas = (jsonObject || []).map(item => {
				return {
					id: item.imdb_code,
					name: item.title,
					poster: item.large_cover_image,
					background: item.background_image_original,
					year: item.year,
					releaseInfo: item.year,
					language: item.language,
					imdbRating: item.rating,
					runtime: item.runtime + 'm',
					genres: item.genres,
					type: 'movie'
				}
			})

			resolve({
				metas,
				cacheMaxAge: cache.maxAge,
				staleError: cache.staleError
			})
		})
	})
}

function getStreams(imdb) {
	return new Promise((resolve, reject) => {

		const query = { query_term: imdb }

		request(endpoint + '/api/v2/list_movies.json/?' + utils.serialize(query), (error, response, data) => {	

			if (error || !data || response.statusCode != 200) {
				reject('Invalid responde from API for: ' + imdb)
				return
			}

			const jsonObject = JSON.parse(data)['data']['movies']

			const item = (jsonObject || []).find(el => {
				return el.imdb_code == imdb
			})

			let streams = []

			if (((item || {}).torrents || []).length)
				streams = item.torrents.map(el => {
					const hash = el.hash.toLowerCase()
					return {
						title: utils.capitalize(el.type) + ' / ' + el.quality + ', S: ' + el.seeds + ' L: ' + el.peers + ', Size: ' + el.size,
						infoHash: hash,
						sources: [
							'dht:' + hash,
							'tracker:udp://tracker.coppersurfer.tk:6969/announce',
							'tracker:udp://9.rarbg.com:2710/announce',
							'tracker:udp://p4p.arenabg.com:1337',
							'tracker:udp://tracker.internetwarriors.net:1337',
							'tracker:udp://tracker.opentrackr.org:1337/announce'
						]
					}
				})

			resolve({
				streams,
				cacheMaxAge: cache.maxAge,
				staleError: cache.staleError
			})
		})
	})
}

const builder = new addonBuilder(manifest)

builder.defineCatalogHandler(args => {
	const start = (args.extra || {}).skip ? Math.round(args.extra.skip / 50) + 1 : 1
	const cat = (args.extra || {}).genre ? args.extra.genre : false
	return getMovies(start, cat)
})

builder.defineStreamHandler(args => {
	return getStreams(args.id)
})

module.exports = builder.getInterface()
