const str = 'بِسْمِ [h:1[ٱ]للَّهِ [h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ [h:3[ٱ][l[ل]رَّح[p[ِي]مِ'; 
console.log(str.replace(/\[([a-zA-Z]+)(?::\d+)?\[([^\[\]]+)\]/g, '<span class="tj-$1">$2</span>'));
