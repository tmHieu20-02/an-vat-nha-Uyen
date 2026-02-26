const fs = require('fs');
const https = require('https');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const images = {
    'com-chay.jpg': 'https://images.unsplash.com/photo-1558403932-f3f2d01be974', // Snacky mix
    'xoai-say.jpg': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba', // Pineapple/Mango vibe
    'xoai-say-deo.jpg': 'https://images.unsplash.com/photo-1600423115367-87bfcfa8162d',
    'chuoi-say.jpg': 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a', // Bananas
    'banh-gau.jpg': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35', // Cookies
    'banh-tai-heo.jpg': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e', // Cookies
    'khoai-tay-pho-mai.jpg': 'https://images.unsplash.com/photo-1576107232684-1279f390859f', // Fries
    'khoai-tay-say.jpg': 'https://images.unsplash.com/photo-1566478989037-e5557ef228be', // Chips
    'khoai-tay-rong-bien.jpg': 'https://images.unsplash.com/photo-1599487779774-602951dcbed6', // Chips mix
    'theo-leo.jpg': 'https://images.unsplash.com/photo-1590747805166-07409c95b452' // Peanuts
};

const tasks = Object.entries(images).map(([name, url]) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(uploadsDir, name);
        // add Unsplash image params for correct sizing
        https.get(url + '?auto=format&fit=crop&w=600&q=80', (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // handle redirect
                https.get(res.headers.location, (res2) => {
                    const file = fs.createWriteStream(filePath);
                    res2.pipe(file);
                    file.on('finish', () => resolve(name));
                    file.on('error', reject);
                });
            } else {
                const file = fs.createWriteStream(filePath);
                res.pipe(file);
                file.on('finish', () => resolve(name));
                file.on('error', reject);
            }
        }).on('error', reject);
    });
});

Promise.all(tasks).then(names => {
    console.log('Downloaded:', names);
}).catch(err => {
    console.error('Download error:', err);
});
