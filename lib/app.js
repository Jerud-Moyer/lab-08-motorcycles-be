const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');
//const e = require('express');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

const fakeUser = {
  id: 1,
  email: 'steve_McQueen@hotbike.com',
  hash: 'gsxr100',
};

app.get('/engine_types', async(req, res) => {
  const data = await client.query('SELECT * FROM engine_types');

  res.json(data.rows);
});

app.get('/motorcycles', async(req, res) => {
  const data = await client.query(`
  SELECT motorcycles.id, model, manufacturer, motorcycles.type, is_fast, engine_types.type as engine, ccs 
  FROM motorcycles 
  JOIN engine_types 
  ON motorcycles.engine_type_id = engine_types.id`);

  res.json(data.rows);
});

app.get('/motorcycles/:id', async(req, res) => {
  const motorcycleId = req.params.id;
  

  const data = await client.query(`SELECT * from motorcycles where id=${motorcycleId}`);

  res.json(data.rows[0]);
});

app.delete('/motorcycles/:id', async(req, res) =>{
  const motorcycleId = req.params.id;

  const data = await client.query('DELETE from motorcycles WHERE motorcycles.id=$1;', [motorcycleId]);

  res.json(data.rows[0]);
});

app.put('/motorcycles/:id', async(req, res) => {
  const motorcycleId = req.params.id;
  

  try {
    const updatedMotorcycle = {
      model: req.body.model,
      manufacturer: req.body.manufacturer,
      type: req.body.type,
      is_fast: req.body.is_fast,
      ccs: req.body.ccs,
      engine_type: req.body.engine_id
    };
    console.log(updatedMotorcycle);
    const data = await client.query(`
      UPDATE motorcycles
        SET model=$1, manufacturer=$2, type=$3, is_fast=$4, ccs=$5, engine_type_id=$6
        WHERE motorcycles.id = $7
        RETURNING *
        `, [updatedMotorcycle.model, updatedMotorcycle.manufacturer, updatedMotorcycle.type, updatedMotorcycle.is_fast, updatedMotorcycle.ccs, updatedMotorcycle.engine_type, motorcycleId]);
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }});

app.post('/motorcycles', async(req, res) => {
  try {
    const newMotorcycle = {
      model: req.body.model,
      manufacturer: req.body.manufacturer,
      type: req.body.type,
      is_fast: req.body.is_fast,
      ccs: req.body.ccs,
      engine_type: req.body.engine_id
    };

    const data = await client.query(`
  INSERT INTO motorcycles(model, manufacturer, type, is_fast, ccs, owner_id, engine_type_id)
  VALUES($1, $2, $3, $4, $5, $6, $7)
  RETURNING *
  `, [newMotorcycle.model, newMotorcycle.manufacturer, newMotorcycle.type, newMotorcycle.is_fast, newMotorcycle.ccs, fakeUser.id, newMotorcycle.engine_type]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
