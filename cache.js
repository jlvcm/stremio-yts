
const db = {}

module.exports = {
	set: (id, data, exp) => {
		db[id] = data
		setTimeout(() => {
			delete db[id]
		}, exp * 1000)
	},
	get: id => {
		return db[id]
	}
}