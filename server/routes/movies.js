const express = require('express');
const router = express.Router();
const Movie = require("../models/Movie");

router.get("/", async (req, res) => {
    try {
        const movies = await Movie.find();
        res.json(movies);

    } catch (error) {
        res.status(500).json({error: 'Failed to retrieve movies'});
    }
})

router.get("/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const movie = await Movie.findById(id);
        if (!movie) {
            return res.status(404).json({error: `No movie found with id: ${req.params.id}`});
        }
        res.json(movie);

    } catch (error) {
        res.status(500).json({error: `Failed to retrieve movie with id: ${req.params.id}`});
    }
})

router.post("/", async (req, res) => {
    try {

        const newMovieData = req.body;
        const movieToSave = new Movie(newMovieData);
        await movieToSave.save();
        res.status(201).json(movieToSave);
    } catch (error) {
        res.status(500).json({error: 'Failed to upload movie'});
    }
})

router.put("/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const updatedMovieData = req.body;

        const updateData = {
            title: updatedMovieData.title,
            director: updatedMovieData.director,
            genre: updatedMovieData.genre,
            releaseYear: updatedMovieData.releaseYear,
            rating: updatedMovieData.rating
        }

        const updatedMovie = await Movie.findByIdAndUpdate(id, updateData, {new: true, runValidators: true});

        if (!updatedMovie) {
            return res.status(404).json({message: `No movie with id ${id} found.`});
        }
        res.status(200).json(updatedMovie);

    } catch (error) {
        res.status(500).json({error: `Failed to edit movie with id: ${req.params.id}`});
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const deletedMovie = await Movie.findByIdAndDelete(id);
        if (!deletedMovie) {
            return res.status(404).json({error: `No movie with id: ${req.params.id}`});
        }
        res.status(200).send({message: "Movie deleted successfully.", movie: deletedMovie});

    } catch (error) {
        res.status(500).json({error: `Failed to delete movie with id: ${req.params.id}`});
    }
})

router.get("/aggregate/average-ratings", async (req, res) => {
    try {

        const averageRatings = await Movie.aggregate([
            {
                $group: {
                    _id: "$genre", // Grupowanie według gatunku
                    averageRating: {$avg: "$rating"} // Obliczanie średniej oceny
                }
            },
            {
                $project: {
                    _id: 0, // Ukrycie pola _id w wynikach
                    genre: "$_id", // Przypisanie gatunku do pola "genre"
                    averageRating: 1 // Zostawienie średniej oceny w wynikach
                }
            },
            {
                $sort: {genre: 1} // Sortowanie wyników alfabetycznie po gatunku
            }

        ]);
        res.status(200).json(averageRatings);

    } catch (error) {
        res.status(500).json({error: 'Failed to retrieve movies'});
    }
})

const initDb = async (req, res, next) => {
    try {
        // 1. Najpierw wyczyszczamy kolekcję:
        await Movie.deleteMany();

        // 2. Budujemy ścieżkę do dużego pliku JSON (zawierającego tablicę filmów):
        //    Upewnij się, że plik faktycznie istnieje w podanej lokalizacji.
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! - teraz przestawiam na wygenerwoane
        // const filePath = path.join(__dirname, '..', 'data', 'data.json');
        const filePath = path.join(__dirname, '..', 'data', 'generated.json');

        // 3. Tworzymy strumień odczytu z pliku i parser JSONStream,
        //    który będzie przetwarzał każdy element tablicy osobno.
        const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
        const parser = JSONStream.parse(''); // '' = każdy element tablicy w pliku

        // 4. Przygotowujemy zmienne do batchowania:
        let docsBatch = [];
        const BATCH_SIZE = 500; // np. co 500 dokumentów zapisuj do bazy
        let insertedCount = 0;

        // 5. Nasłuchujemy zdarzenia "data" — za każdym razem, gdy JSONStream odczyta kolejny obiekt:
        parser.on('data', async (doc) => {
            // Dodaj obiekt do paczki:
            docsBatch.push(doc);

            // Jeśli paczka osiągnęła BATCH_SIZE, wstawiamy ją do Mongo i resetujemy.
            if (docsBatch.length >= BATCH_SIZE) {
                // Wstrzymujemy parser, żeby nie nadchodziły kolejne obiekty w trakcie zapisu:
                parser.pause();
                await Movie.insertMany(docsBatch);
                insertedCount += docsBatch.length;
                docsBatch = [];
                // Wznawiamy wczytywanie:
                parser.resume();
            }
        });

        // 6. Zdarzenie "end" nastąpi, gdy parser przerobi cały plik:
        parser.on('end', async () => {
            // Wstawiamy ostatnią paczkę, jeśli coś w niej zostało:
            if (docsBatch.length) {
                await Movie.insertMany(docsBatch);
                insertedCount += docsBatch.length;
            }
            // Zwracamy odpowiedź JSON:
            return res.json({
                message: 'Movies DB inited successfully (streaming)',
                insertedCount
            });
        });

        // 7. Obsługa błędów parsera — wywołujemy next(err), żeby nasz globalny errorHandler je przechwycił.
        parser.on('error', (err) => {
            next(err);
        });

        // 8. Łączymy strumień z parserem — to rozpoczyna proces wczytywania i przetwarzania danych.
        readStream.pipe(parser);

    } catch (err) {
        next(err);
    }
}

module.exports = router