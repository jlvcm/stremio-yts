
module.exports = {
	capitalize: string => {
		return string ? string.charAt(0).toUpperCase() + string.slice(1) : ''
	},
	serialize: obj => {
		return Object.keys(obj).filter(k => !!obj[k]).map(k => k + '=' + encodeURIComponent(obj[k])).join('&')
	}
}