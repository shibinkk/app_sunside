const fs = require('fs');
const https = require('https');

const url = 'https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        const countries = JSON.parse(data);
        const formatted = countries.map(c => ({
            name: c.name.common,
            code: c.cca2,
            dial_code: c.idd.root + (c.idd.suffixes ? c.idd.suffixes[0] : ''),
            flag: c.flags.png
        })).sort((a, b) => a.name.localeCompare(b.name));

        fs.writeFileSync('./constants/countries.json', JSON.stringify(formatted, null, 2));
        console.log('Saved ' + formatted.length + ' countries to ./constants/countries.json');
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
