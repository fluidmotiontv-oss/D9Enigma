
export const countryNodes = Array.from({ length: 36 }, (_, i) => ({

id: i,

name: "Location " + (i + 1),

offset: (i / 36) * Math.PI * 2

}));
