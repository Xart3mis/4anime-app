function infiniteLoadFix(link){
	let goodCode = 42489
	let badId = link.split('?')[1].split('=')[1];
	let mainUrl = link.split('=')[0]+'='
	console.log(badId);
	console.log(mainUrl)
	if(badId!=goodCode){
		return mainUrl+'4289'
	}
}

console.log(infiniteLoadFix('https://4anime.to/kyoukai-no-kanata-episode-01?id=21846'))