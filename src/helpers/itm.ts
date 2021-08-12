import proj4 from 'proj4';
proj4.defs("ITM","+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444445 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=-48,55,52,0,0,0,0 +units=m +no_defs");

export const gps2itm: (latitude: number, longitude: number, oldGrid?: boolean) => Promise<any> = (latitude, longitude, oldGrid) => {
    return new Promise((res, rej) => {
        if (isNaN(latitude) || isNaN(longitude)) return rej(new Error(`Invalid cords ${latitude} ${longitude}`));

        try{
            const itm_coords = proj4('EPSG:4326', 'ITM', [parseFloat(longitude.toString()), parseFloat(latitude.toString())]);
    
            res(oldGrid ?
                { east: (itm_coords[0] - 50000).toFixed(0), north: (function (val) { return (val > 0 ? val : val + 1000000).toFixed(0) })(itm_coords[1] - 500000) } :
                {
                    east: itm_coords[0].toFixed(0),
                    north: itm_coords[1].toFixed(0)
                }
            );
        }catch(e){
            return rej(e)
        }
    })
}

export const itm2gps: (east: number, north: number) => Promise<any> = (east, north) => {
    return new Promise((res, rej) => {
        if (!window.proj4) return rej(new Error('Please install proj4, https://www.npmjs.com/package/proj4'));
        if (isNaN(east) || isNaN(north)) return rej(new Error('Invalid North or East value'));

        const lng_lat = proj4('ITM', 'EPSG:4326', [parseFloat(east.toString()), parseFloat(north.toString())]);

        return {
            longitude: lng_lat[0].toFixed(6),
            latitude: lng_lat[1].toFixed(6)
        }
    });
}

export const multiPolygan2itm: (MultiPolygon: any[])=>Promise<string> = (MultiPolygon) => {
    return new Promise((res, rej) => {
        Promise.all(MultiPolygon.map((x: [number, number]) => {
            return gps2itm(x[1], x[0]).then(data => [data.east, data.north])
        })).then(data => res(`POLYGON((${data.map(x=>x.join(" ")).join(",")}))`)).catch(e => rej(e))

    })
}