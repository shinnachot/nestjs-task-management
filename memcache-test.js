const Memcached = require('memcached');  // Use require instead of import

const memcached = new Memcached('localhost:11211');

memcached.set('test_key', 'test_value', 3600, (err) => {
  if (err) throw err;
  console.log('Cache set successfully');
});

memcached.get('test_key', (err, data) => {
  if (err) throw err;
  console.log('Fetched data: ', data);
});