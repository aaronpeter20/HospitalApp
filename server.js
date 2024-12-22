const http = require('http');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'hospital.json');

const readFile = () => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading file:', err);
    return [];
  }
};

const writeFile = (data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('File updated successfully');
  } catch (err) {
    console.error('Error writing file:', err);
  }
};

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (url === '/display' && method === 'GET') {
    const hospitals = readFile();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(hospitals));
  }

  else if (url === '/add' && method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const newHospital = JSON.parse(body);
        const hospitals = readFile();
        hospitals.push(newHospital);
        writeFile(hospitals);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(hospitals));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON data' }));
      }
    });
  }

  else if (url.startsWith('/edit/') && method === 'PUT') {
    const name = decodeURIComponent(url.split('/')[2]);
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const updatedData = JSON.parse(body);
        const hospitals = readFile();
        const index = hospitals.findIndex((h) => h.name === name);

        if (index !== -1) {
          hospitals[index] = { ...hospitals[index], ...updatedData };
          writeFile(hospitals);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `${name} updated successfully` }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Hospital with name ${name} not found` }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid JSON data' }));
      }
    });
  }

  else if (url.startsWith('/delete/') && method === 'DELETE') {
    const name = decodeURIComponent(url.split('/')[2]);
    const hospitals = readFile();
    const filteredHospitals = hospitals.filter((h) => h.name !== name);

    if (hospitals.length === filteredHospitals.length) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `Hospital with name ${name} not found` }));
    } else {
      writeFile(filteredHospitals);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `${name} deleted successfully` }));
    }
  }

  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Route not found' }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});