import fs from 'fs';

// Helper function để tạo số ngẫu nhiên trong khoảng
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function để tạo ngày ngẫu nhiên trong khoảng
const randomDate = (start: Date, end: Date) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Helper function để format date thành chuỗi YYYY-MM-DD
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[ 0 ];
};

// Dữ liệu mẫu
const sampleData = {
  // Danh sách tên phim mẫu
  movieTitles: [
    'The Adventure',
    'Love Story',
    'Action Hero',
    'Comedy Night',
    'Mystery Case',
    'Space Journey',
    'Historical Drama',
    'Family Fun',
    'Thriller Night',
    'Romance in Paris',
    'Detective Story',
    'Fantasy World',
    'Science Fiction',
    'Western Tale',
    'Horror House',
    'Musical Show',
  ],

  categories: [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Romance',
    'Sci-Fi',
    'Thriller',
    'Documentary',
    'Animation',
    'Adventure',
    'Family',
    'Fantasy',
    'Musical',
    'Western',
    'Mystery',
    'Crime',
  ],

  actors: [
    { first: 'John', last: 'Smith' },
    { first: 'Mary', last: 'Johnson' },
    { first: 'Robert', last: 'Williams' },
    { first: 'Emma', last: 'Brown' },
    { first: 'Michael', last: 'Davis' },
    { first: 'Sarah', last: 'Miller' },
    { first: 'David', last: 'Wilson' },
    { first: 'Jennifer', last: 'Taylor' },
  ],

  cities: [
    'New York',
    'London',
    'Paris',
    'Tokyo',
    'Sydney',
    'Berlin',
    'Rome',
    'Moscow',
    'Beijing',
    'Dubai',
    'Singapore',
    'Toronto',
  ],

  countries: [
    'USA',
    'UK',
    'France',
    'Japan',
    'Australia',
    'Germany',
    'Italy',
    'Russia',
    'China',
    'UAE',
    'Singapore',
    'Canada',
  ],

  ratings: [ 'G', 'PG', 'PG-13', 'R', 'NC-17' ],
};

const generateQueryInput = () => {
  const currentDate = new Date();
  const pastDate = new Date();
  pastDate.setFullYear(currentDate.getFullYear() - 2);

  return {
    search_term:
      sampleData.movieTitles[ randomInt(0, sampleData.movieTitles.length - 1) ],
    category:
      sampleData.categories[ randomInt(0, sampleData.categories.length - 1) ],
    actor_first_name:
      sampleData.actors[ randomInt(0, sampleData.actors.length - 1) ].first,
    actor_last_name:
      sampleData.actors[ randomInt(0, sampleData.actors.length - 1) ].last,

    customer_id: randomInt(1, 500),
    store_id: randomInt(1, 10),

    limit: randomInt(10, 50),
    offset: randomInt(0, 100),

    start_date: formatDate(randomDate(pastDate, currentDate)),
    end_date: formatDate(currentDate),
    year: randomInt(2020, 2024),
    month: randomInt(1, 12),

    min_rentals: randomInt(5, 20),
    min_amount: randomInt(20, 100),
    rental_period: randomInt(1, 14),

    city: sampleData.cities[ randomInt(0, sampleData.cities.length - 1) ],
    country:
      sampleData.countries[ randomInt(0, sampleData.countries.length - 1) ],

    rating: sampleData.ratings[ randomInt(0, sampleData.ratings.length - 1) ],
    max_price: randomInt(5, 15),
    duration: randomInt(60, 180),

    months: randomInt(1, 12),
    inactive_days: randomInt(30, 90),
    at_risk_days: randomInt(15, 29),

    staff_id: randomInt(1, 10),

    day_of_week: randomInt(0, 6),
    min_pairs: randomInt(2, 10),
  };
};

type QueryInput = ReturnType<typeof generateQueryInput>;

// Generate 1000 sets of random inputs
const generateQueryInputs = (count = 1000) => {
  const inputs: QueryInput[] = [];
  for (let i = 0; i < count; i++) {
    inputs.push(generateQueryInput());
  }
  return inputs;
};

const generateExampleQueries = (
  inputs: QueryInput[],
  queryTemplates: string[]
) => {
  const queries = [];

  for (const input of inputs) {
    for (const template of queryTemplates) {
      let query = template;

      // Replace all ${param} in template with actual values
      for (const [ key, value ] of Object.entries(input)) {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        query = query.replace(regex, String(value));
      }

      queries.push(query);
    }
  }

  return queries;
};

const total = 100;
const inputs = generateQueryInputs(total);

const queryTemplates = [
  "SELECT title, description, release_year, rating FROM film WHERE LOWER(title) LIKE LOWER('%${search_term}%')",
  'SELECT title, rental_rate FROM film WHERE rental_rate <= ${max_price}',
  'SELECT title, length as duration FROM film WHERE length <= ${duration}',
  "SELECT title, rating FROM film WHERE rating = '${rating}'",
  'SELECT title FROM film WHERE release_year = ${year}',
  "SELECT f.title, c.name as category FROM film f JOIN film_category fc ON f.film_id = fc.film_id JOIN category c ON fc.category_id = c.category_id WHERE LOWER(c.name) = LOWER('${category}')",
  'SELECT DISTINCT c.name, COUNT(*) as film_count FROM category c JOIN film_category fc ON c.category_id = fc.category_id GROUP BY c.name HAVING COUNT(*) >= ${min_rentals}',
  'SELECT c.name, AVG(f.rental_rate) as avg_price FROM category c JOIN film_category fc ON c.category_id = fc.category_id JOIN film f ON fc.film_id = f.film_id GROUP BY c.name',
  "SELECT DISTINCT f.title FROM film f JOIN film_actor fa ON f.film_id = fa.film_id JOIN actor a ON fa.actor_id = a.actor_id WHERE LOWER(a.first_name) LIKE LOWER('${actor_first_name}%')",
  'SELECT a.first_name, a.last_name, COUNT(*) as film_count FROM actor a JOIN film_actor fa ON a.actor_id = fa.actor_id GROUP BY a.actor_id, a.first_name, a.last_name HAVING COUNT(*) >= ${min_rentals}',
  'SELECT r.rental_date, f.title FROM rental r JOIN inventory i ON r.inventory_id = i.inventory_id JOIN film f ON i.film_id = f.film_id WHERE r.customer_id = ${customer_id} ORDER BY r.rental_date DESC LIMIT ${limit}',
  'SELECT COUNT(*) as total_rentals FROM rental WHERE customer_id = ${customer_id}',
  'SELECT SUM(p.amount) as total_spent FROM payment p WHERE customer_id = ${customer_id}',
  'SELECT f.title, r.rental_date FROM rental r JOIN inventory i ON r.inventory_id = i.inventory_id JOIN film f ON i.film_id = f.film_id WHERE r.customer_id = ${customer_id} AND r.return_date IS NULL',
  'SELECT COUNT(*) as active_rentals FROM rental WHERE customer_id = ${customer_id} AND return_date IS NULL',
  'SELECT f.title, COUNT(i.inventory_id) as copies_available FROM film f JOIN inventory i ON f.film_id = i.film_id WHERE i.store_id = ${store_id} GROUP BY f.film_id, f.title',
  'SELECT f.title FROM film f JOIN inventory i ON f.film_id = i.film_id WHERE i.store_id = ${store_id} AND NOT EXISTS (SELECT 1 FROM rental r WHERE r.inventory_id = i.inventory_id AND r.return_date IS NULL)',
  'SELECT c.name as category, COUNT(*) as rental_count FROM rental r JOIN inventory i ON r.inventory_id = i.inventory_id JOIN film f ON i.film_id = f.film_id JOIN film_category fc ON f.film_id = fc.film_id JOIN category c ON fc.category_id = c.category_id WHERE r.customer_id = ${customer_id} GROUP BY c.name ORDER BY rental_count DESC',
  'SELECT EXTRACT(HOUR FROM rental_date) as hour, COUNT(*) as rental_count FROM rental WHERE customer_id = ${customer_id} GROUP BY EXTRACT(HOUR FROM rental_date) ORDER BY rental_count DESC',
  "SELECT TO_CHAR(r.rental_date, 'Day') as day_of_week, COUNT(*) as rental_count FROM rental r WHERE r.customer_id = ${customer_id} GROUP BY TO_CHAR(r.rental_date, 'Day'), EXTRACT(DOW FROM r.rental_date) ORDER BY EXTRACT(DOW FROM r.rental_date)",
  "SELECT DATE_TRUNC('month', payment_date) as month, SUM(amount) as total_spent FROM payment WHERE customer_id = ${customer_id} GROUP BY DATE_TRUNC('month', payment_date) ORDER BY month DESC",
  'SELECT AVG(amount) as avg_payment FROM payment WHERE customer_id = ${customer_id}',
  'SELECT MAX(amount) as max_payment FROM payment WHERE customer_id = ${customer_id}',
  "SELECT s.store_id, a.address, c.city FROM store s JOIN address a ON s.address_id = a.address_id JOIN city c ON a.city_id = c.city_id WHERE LOWER(c.city) LIKE LOWER('${city}%')",
  "SELECT s.store_id, a.address FROM store s JOIN address a ON s.address_id = a.address_id JOIN city c ON a.city_id = c.city_id JOIN country co ON c.country_id = co.country_id WHERE LOWER(co.country) = LOWER('${country}')",
  'SELECT f.title FROM film f JOIN film_category fc ON f.film_id = fc.film_id WHERE fc.category_id IN (SELECT DISTINCT fc2.category_id FROM rental r JOIN inventory i ON r.inventory_id = i.inventory_id JOIN film f2 ON i.film_id = f2.film_id JOIN film_category fc2 ON f2.film_id = fc2.film_id WHERE r.customer_id = ${customer_id}) AND f.film_id NOT IN (SELECT DISTINCT f3.film_id FROM rental r2 JOIN inventory i2 ON r2.inventory_id = i2.inventory_id JOIN film f3 ON i2.film_id = f3.film_id WHERE r2.customer_id = ${customer_id})',
  'SELECT f.title FROM film f WHERE f.rating IN (SELECT DISTINCT f2.rating FROM rental r JOIN inventory i ON r.inventory_id = i.inventory_id JOIN film f2 ON i.film_id = f2.film_id WHERE r.customer_id = ${customer_id})',
  'SELECT f.title, COUNT(*) as rental_count FROM rental r JOIN inventory i ON r.inventory_id = i.inventory_id JOIN film f ON i.film_id = f.film_id WHERE EXTRACT(MONTH FROM r.rental_date) = ${month} GROUP BY f.film_id, f.title HAVING COUNT(*) >= ${min_rentals} ORDER BY rental_count DESC',
  'SELECT f.title, COUNT(*) as rental_count FROM rental r JOIN inventory i ON r.inventory_id = i.inventory_id JOIN film f ON i.film_id = f.film_id WHERE EXTRACT(YEAR FROM r.rental_date) = ${year} GROUP BY f.film_id, f.title ORDER BY rental_count DESC LIMIT 10',
  "SELECT DATE_TRUNC('month', rental_date) as month, COUNT(*) as rental_count FROM rental WHERE customer_id = ${customer_id} GROUP BY DATE_TRUNC('month', rental_date) ORDER BY month",
  'SELECT NOW() - MAX(rental_date) as time_since_last_rental FROM rental WHERE customer_id = ${customer_id}',
  'SELECT f.title, f.length as duration FROM film f WHERE f.length BETWEEN ${duration} - 10 AND ${duration} + 10',
  'SELECT f.rating, AVG(f.length) as avg_duration FROM film f GROUP BY f.rating',
  "SELECT a.first_name, a.last_name, f.title, f.release_year FROM actor a JOIN film_actor fa ON a.actor_id = fa.actor_id JOIN film f ON fa.film_id = f.film_id WHERE LOWER(a.first_name) = LOWER('${actor_first_name}') AND LOWER(a.last_name) = LOWER('${actor_last_name}') ORDER BY f.release_year DESC",
  "SELECT a.first_name, a.last_name, c.name as category, COUNT(*) as films_in_category FROM actor a JOIN film_actor fa ON a.actor_id = fa.actor_id JOIN film f ON fa.film_id = f.film_id JOIN film_category fc ON f.film_id = fc.film_id JOIN category c ON fc.category_id = c.category_id WHERE LOWER(a.first_name) = LOWER('${actor_first_name}') AND LOWER(a.last_name) = LOWER('${actor_last_name}') GROUP BY a.first_name, a.last_name, c.name",
  'SELECT s.store_id, COUNT(*) as rental_count FROM store s JOIN inventory i ON s.store_id = i.store_id JOIN rental r ON i.inventory_id = r.inventory_id WHERE EXTRACT(MONTH FROM r.rental_date) = ${month} GROUP BY s.store_id',
  'SELECT s.store_id, SUM(p.amount) as total_revenue FROM store s JOIN inventory i ON s.store_id = i.store_id JOIN rental r ON i.inventory_id = r.inventory_id JOIN payment p ON r.rental_id = p.rental_id WHERE EXTRACT(YEAR FROM r.rental_date) = ${year} GROUP BY s.store_id',
  'SELECT c.name as category, COUNT(*) as rental_count, ROUND(AVG(f.rental_rate), 2) as avg_rental_rate FROM rental r JOIN inventory i ON r.inventory_id = i.inventory_id JOIN film f ON i.film_id = f.film_id JOIN film_category fc ON f.film_id = fc.film_id JOIN category c ON fc.category_id = c.category_id WHERE r.customer_id = ${customer_id} GROUP BY c.name ORDER BY rental_count DESC',
  'SELECT f.rating, COUNT(*) as film_count, AVG(f.rental_rate) as avg_rental_rate FROM film f GROUP BY f.rating',
  'SELECT f.rating, c.name as category, COUNT(*) as film_count FROM film f JOIN film_category fc ON f.film_id = fc.film_id JOIN category c ON fc.category_id = c.category_id GROUP BY f.rating, c.name ORDER BY f.rating, film_count DESC',
  'SELECT f.title, EXTRACT(DAY FROM (r.return_date - r.rental_date)) as rental_duration FROM rental r JOIN inventory i ON r.inventory_id = i.inventory_id JOIN film f ON i.film_id = f.film_id WHERE r.customer_id = ${customer_id} AND r.return_date IS NOT NULL',
  'SELECT AVG(EXTRACT(DAY FROM (r.return_date - r.rental_date))) as avg_rental_duration FROM rental r WHERE r.customer_id = ${customer_id} AND r.return_date IS NOT NULL',
  'SELECT l.name as language, COUNT(*) as film_count FROM film f JOIN language l ON f.language_id = l.language_id GROUP BY l.name',
  'SELECT l.name as language, AVG(f.rental_rate) as avg_rental_rate FROM film f JOIN language l ON f.language_id = l.language_id GROUP BY l.name',
  'SELECT s.first_name, s.last_name, COUNT(*) as rental_count FROM staff s JOIN rental r ON s.staff_id = r.staff_id WHERE s.store_id = ${store_id} GROUP BY s.staff_id, s.first_name, s.last_name',
  'SELECT s.first_name, s.last_name, SUM(p.amount) as total_payments FROM staff s JOIN payment p ON s.staff_id = p.staff_id WHERE EXTRACT(MONTH FROM p.payment_date) = ${month} GROUP BY s.staff_id, s.first_name, s.last_name',
  "SELECT f.title, f.special_features FROM film f WHERE f.special_features @> ARRAY['${feature}']",
  'SELECT unnest(special_features) as feature, COUNT(*) as feature_count FROM film GROUP BY feature ORDER BY feature_count DESC',
  'SELECT EXTRACT(DOW FROM payment_date) as day_of_week, AVG(amount) as avg_payment FROM payment WHERE customer_id = ${customer_id} GROUP BY EXTRACT(DOW FROM payment_date) ORDER BY day_of_week',
  'SELECT EXTRACT(HOUR FROM payment_date) as hour_of_day, COUNT(*) as payment_count FROM payment WHERE customer_id = ${customer_id} GROUP BY EXTRACT(HOUR FROM payment_date) ORDER BY hour_of_day',
  "SELECT c.name as category, DATE_TRUNC('month', r.rental_date) as month, COUNT(*) as rental_count FROM category c JOIN film_category fc ON c.category_id = fc.category_id JOIN film f ON fc.film_id = f.film_id JOIN inventory i ON f.film_id = i.film_id JOIN rental r ON i.inventory_id = r.inventory_id GROUP BY c.name, DATE_TRUNC('month', r.rental_date) ORDER BY month DESC, rental_count DESC",
  'SELECT f.title, COUNT(r.rental_id) as rental_count, COUNT(i.inventory_id) as total_copies, ROUND(COUNT(r.rental_id)::NUMERIC / NULLIF(COUNT(i.inventory_id), 0), 2) as turnover_rate FROM film f JOIN inventory i ON f.film_id = i.film_id LEFT JOIN rental r ON i.inventory_id = r.inventory_id WHERE i.store_id = ${store_id} GROUP BY f.film_id, f.title HAVING COUNT(i.inventory_id) > 0 ORDER BY turnover_rate DESC',
  'SELECT EXTRACT(HOUR FROM r.rental_date) as hour_of_day, COUNT(*) as rental_count FROM rental r WHERE r.customer_id = ${customer_id} GROUP BY hour_of_day ORDER BY hour_of_day',
  'SELECT EXTRACT(DOW FROM r.rental_date) as day_of_week, COUNT(*) as rental_count FROM rental r WHERE r.customer_id = ${customer_id} GROUP BY day_of_week ORDER BY day_of_week',
];

const queries = generateExampleQueries(inputs, queryTemplates).slice(
  0,
  total
);

// Save example queries to file
fs.writeFileSync('query/normal.txt', queries.join('\n'), 'utf8');

console.log(`Generated ${inputs.length} input sets`);
console.log(`Files saved: query/normal.txt`);
