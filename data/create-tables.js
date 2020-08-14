const client = require('../lib/client');
const { getEmoji } = require('../lib/emoji.js');

// async/await needs to run in a function
run();

async function run() {

  try {
    // initiate connecting to db
    await client.connect();

    // run a query to create tables
    await client.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(256) NOT NULL,
                    hash VARCHAR(512) NOT NULL
                );
                
                CREATE TABLE engine_types (
                  id SERIAL PRIMARY KEY NOT NULL,
                  type VARCHAR (56) NOT NULL
                );
                CREATE TABLE motorcycles (
                    id SERIAL PRIMARY KEY NOT NULL,
                    model VARCHAR(512) NOT NULL,
                    manufacturer VARCHAR(50) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    is_fast BOOLEAN NOT NULL,
                    ccs INTEGER NOT NULL,
                    engine_type_id INTEGER NOT NULL REFERENCES engine_types(id),
                    owner_id INTEGER NOT NULL REFERENCES users(id)
            );
               
        `);

    console.log('create tables complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    // problem? let's see the error...
    console.log(err);
  }
  finally {
    // success or failure, need to close the db connection
    client.end();
  }

}
