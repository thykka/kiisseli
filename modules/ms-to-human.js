const mthTranslation = {
	years:   { singular: 'vuoden',    plural: 'vuotta' },
	months:  { singular: 'kuukauden', plural: 'kuukautta' },
	days:    { singular: 'päivän',    plural: 'päivää' },
	hours:   { singular: 'tunnin',    plural: 'tuntia' },
	minutes: { singular: 'minuutin',  plural: 'minuuttia' },
	seconds: { singular: 'sekunnin',  plural: 'sekuntia' },
  joiner: ' ja '
};

const msToHuman = (ms, tr = mthTranslation) => {
	let remain = ms;
  const seconds = Math.floor(remain/1000)%60;
  remain-=seconds*1000
  const	minutes = Math.floor(remain/(1000*60))%60;
  remain-=minutes*1000*60
  const hours = Math.floor(remain/(1000*60*60))%24;
  remain-=hours*1000*60*60
  const days = Math.floor(remain/(1000*60*60*24))%30;
  remain-=days*1000*60*60*24
  const months = Math.floor(remain/(1000*60*60*24*30))%12;
  remain-=months*1000*60*60*24*30
  const years = Math.floor(remain/(1000*60*60*24*30*12));
  remain-=years*1000*60*60*24*30*12
  
  const parts = Object.entries({seconds,minutes,hours,days,months,years})
    .filter(([_, value], index) => value > 0 || index === 0)
    .map(([field, value]) => `${ value } ${
      tr[field][value === 1 ? 'singular' : 'plural']
    }`).reverse();
  
	return [
    parts.slice(0,parts.length - 1).join(', '),
    parts[parts.length - 1]
  ].filter(v => !!v).join(tr.joiner)

};

export default msToHuman;