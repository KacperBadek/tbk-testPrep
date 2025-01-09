const { faker } = require('@faker-js/faker');
const fs = require('fs');

//node faker/generateMovies.js

function generateMovie() {
    return {
        title: faker.lorem.words(3),
        director: faker.person.fullName(),
        genre: faker.helpers.arrayElement(['Action', 'Drama', 'Comedy', 'Horror', 'Sci-Fi']),
        releaseYear: faker.number.int({ min: 1980, max: 2025 }),
        rating: faker.number.float({ min: 1, max: 10, precision: 0.1 })
    };
}

const movies = Array.from({ length: 1000 }, generateMovie);
fs.writeFileSync('movies.json', JSON.stringify(movies, null, 2), 'utf-8');
console.log('movies.json file has been generated with 1000 movies.');

